#!/usr/bin/env python3
"""HUMAN FORGE actor builder (original code).

Copyright © 2026 NEURO / AGENTROPOLIS. All rights reserved.
This file intentionally carries no open-source license.
No license to reproduce, modify, redistribute, sublicense, or commercially
exploit this file is granted unless expressly authorized in writing.

Builds a skinned, morph-target glTF 2.0 binary (GLB) human actor from CC0
MakeHuman 1.1 assets (base mesh hm08, default 163-bone skeleton, CC0 weights,
CC0 face pose units). Facial blendshapes are *baked* here by posing the CC0
face skeleton with each CC0 pose unit and storing the linear-blend-skinned
vertex deltas as glTF morph targets. No MakeHuman program code is used or
shipped (math re-implemented from the documented skeleton conventions).

Usage: python3 build_actor.py <source_dir> <out.glb> [--no-morphs]
"""
import json, struct, sys, math, os
import numpy as np

SRC = sys.argv[1]; OUT = sys.argv[2]; WITH_MORPHS = '--no-morphs' not in sys.argv
SCALE = 0.1  # MakeHuman units are decimetres -> metres

KEEP_GROUPS = {'body': 'body', 'helper-l-eye': 'eye', 'helper-r-eye': 'eye',
               'helper-upper-teeth': 'teeth', 'helper-lower-teeth': 'teeth',
               'helper-tongue': 'mouth'}

# ---------------- OBJ ----------------
V, VT, faces = [], [], []   # faces: (group_kind, [(vi, ti), ...])
grp = None
with open(os.path.join(SRC, 'base.obj')) as f:
    for line in f:
        if line.startswith('v '):
            V.append([float(x) for x in line.split()[1:4]])
        elif line.startswith('vt '):
            VT.append([float(x) for x in line.split()[1:3]])
        elif line.startswith('g '):
            grp = line.split(None, 1)[1].strip()
        elif line.startswith('f '):
            kind = KEEP_GROUPS.get(grp)
            if kind is None:
                continue
            corners = []
            for c in line.split()[1:]:
                p = c.split('/')
                corners.append((int(p[0]) - 1, int(p[1]) - 1 if len(p) > 1 and p[1] else -1))
            faces.append((kind, corners))
V = np.array(V, dtype=np.float64) * SCALE
VT = np.array(VT, dtype=np.float64)
floor = V[:, 1].min()  # recomputed below from kept verts
used = sorted({vi for _, cs in faces for vi, _ in cs})
floor = V[used, 1].min()
V[:, 1] -= floor          # feet on y=0

# ---------------- Skeleton ----------------
sk = json.load(open(os.path.join(SRC, 'default.mhskel')))
J = {k: V[np.array(v)].mean(axis=0) for k, v in sk['joints'].items()}
bones = sk['bones']
children = {}
roots = []
for n, b in bones.items():
    if b['parent']:
        children.setdefault(b['parent'], []).append(n)
    else:
        roots.append(n)
order = []
queue = sorted(roots)
while queue:  # breadth-first, deterministic
    n = queue.pop(0); order.append(n); queue += sorted(children.get(n, []))
bidx = {n: i for i, n in enumerate(order)}

def normalize(v):
    l = np.linalg.norm(v); return v / l if l > 1e-12 else v

def plane_normal(pn):
    if pn not in sk['planes']:
        return np.array([0, 1.0, 0])
    j1, j2, j3 = sk['planes'][pn]
    p1, p2, p3 = J[j1], J[j2], J[j3]
    n = normalize(np.cross(normalize(p3 - p2), normalize(p2 - p1)))
    return n if np.linalg.norm(n) > 1e-6 else np.array([0, 1.0, 0])

def rest_matrix(head, tail, normal):
    m = np.eye(4); y = normalize(tail - head); n = normalize(normal)
    z = normalize(np.cross(n, y)); x = normalize(np.cross(y, z))
    m[:3, 0], m[:3, 1], m[:3, 2], m[:3, 3] = x, y, z, head
    return m

RestG = np.zeros((len(order), 4, 4)); RestR = np.zeros_like(RestG)
for n in order:
    b = bones[n]; i = bidx[n]
    RestG[i] = rest_matrix(J[b['head']], J[b['tail']], plane_normal(b['rotation_plane']))
    RestR[i] = np.linalg.inv(RestG[bidx[b['parent']]]) @ RestG[i] if b['parent'] else RestG[i]
parent_idx = [bidx[bones[n]['parent']] if bones[n]['parent'] else -1 for n in order]

# ---------------- Weights (top-4, normalised) ----------------
W = json.load(open(os.path.join(SRC, 'default_weights.mhw')))['weights']
per_vert = {}
for bn, lst in W.items():
    for vi, w in lst:
        per_vert.setdefault(vi, []).append((w, bidx[bn]))
nV = len(V)
JI = np.zeros((nV, 4), dtype=np.uint16); JW = np.zeros((nV, 4), dtype=np.float32)
JW[:, 0] = 1.0  # unweighted verts -> root (index 0)
for vi, lst in per_vert.items():
    lst = sorted(lst, reverse=True)[:4]
    s = sum(w for w, _ in lst)
    for k, (w, b) in enumerate(lst):
        JI[vi, k] = b; JW[vi, k] = w / s
    for k in range(len(lst), 4):
        JW[vi, k] = 0.0

# ---------------- Face pose units (BVH, Z-up) -> morph targets ----------------
def parse_bvh(path):
    joints, stack, chans = [], [], []
    with open(path) as f:
        lines = f.read().split('\n')
    i = 0
    while not lines[i].strip().startswith('MOTION'):
        t = lines[i].split()
        if t and t[0] in ('ROOT', 'JOINT'):
            joints.append(t[1])
        elif t and t[0] == 'CHANNELS':
            chans.append((joints[-1], t[2:]))
        i += 1
    nframes = int(lines[i + 1].split()[1])
    data = [list(map(float, l.split())) for l in lines[i + 3:i + 3 + nframes]]
    return chans, np.array(data)

def rx(a): c, s = math.cos(a), math.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def ry(a): c, s = math.cos(a), math.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def rz(a): c, s = math.cos(a), math.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
C = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]], dtype=float)  # Z-up -> Y-up basis change

morph_names, morph_deltas = [], []
if WITH_MORPHS:
    names = json.load(open(os.path.join(SRC, 'face-poseunits.json')))['framemapping']
    chans, frames = parse_bvh(os.path.join(SRC, 'face-poseunits.bvh'))
    restpos = V.copy()
    for fi, pname in enumerate(names):
        if fi == 0:
            continue  # 'Rest'
        rot_world = {}
        col = 0
        for jn, ch in chans:
            vals = frames[fi, col:col + len(ch)]; col += len(ch)
            R = np.eye(3)
            for c_name, v in zip(ch, vals):
                a = math.radians(v)
                if c_name == 'Xrotation': R = R @ rx(a)
                elif c_name == 'Yrotation': R = R @ ry(a)
                elif c_name == 'Zrotation': R = R @ rz(a)
            rot_world[jn] = C @ R @ C.T
        PoseG = np.zeros_like(RestG)
        for i, n in enumerate(order):
            Mp = np.eye(4)
            if n in rot_world and n != 'root':
                Rr = RestG[i][:3, :3]
                Mp[:3, :3] = Rr.T @ rot_world[n] @ Rr
            PoseG[i] = (PoseG[parent_idx[i]] @ RestR[i] @ Mp) if parent_idx[i] >= 0 else RestR[i] @ Mp
        Skin = np.einsum('bij,bjk->bik', PoseG, np.linalg.inv(RestG))
        hom = np.c_[restpos, np.ones(nV)]
        posed = np.zeros((nV, 3))
        for k in range(4):
            M = Skin[JI[:, k].astype(int)]
            posed += JW[:, k:k + 1] * np.einsum('vij,vj->vi', M, hom)[:, :3]
        d = posed - restpos
        d[np.linalg.norm(d, axis=1) < 1e-5] = 0.0  # kill float noise -> sparse-friendly
        if np.abs(d).max() < 1e-6:
            continue
        morph_names.append(pname); morph_deltas.append(d.astype(np.float32))

# ---------------- Build glTF vertex streams (split on UV seams) ----------------
SKIN_ROOTS = {'neck01', 'wrist.L', 'wrist.R'}
def subtree(r):
    out = {r}; q = [r]
    while q:
        n = q.pop(); out |= set(children.get(n, [])); q += children.get(n, [])
    return out
skin_bones = set().union(*[subtree(r) for r in SKIN_ROOTS])
skin_bone_idx = {bidx[b] for b in skin_bones}
NECK_Y = RestG[bidx['neck01']][1, 3] - 0.015   # clean collar line just below neck01 head
hand_idx = set().union(*[{bidx[b] for b in subtree(r)} for r in ('wrist.L', 'wrist.R')])
def vert_is_skin(vi):
    return V[vi, 1] > NECK_Y or int(JI[vi, 0]) in hand_idx

prims = {}  # material -> list of triangles of (vi,ti)
for kind, cs in faces:
    if kind == 'body':
        mat = 'skin' if all(vert_is_skin(vi) for vi, _ in cs) else 'suit'
    else:
        mat = kind
    tris = [(cs[0], cs[k], cs[k + 1]) for k in range(1, len(cs) - 1)]
    prims.setdefault(mat, []).extend(tris)

def compute_normals(pos, idx):
    n = np.zeros_like(pos)
    tri = idx.reshape(-1, 3)
    fn = np.cross(pos[tri[:, 1]] - pos[tri[:, 0]], pos[tri[:, 2]] - pos[tri[:, 0]])
    for k in range(3):
        np.add.at(n, tri[:, k], fn)
    l = np.linalg.norm(n, axis=1, keepdims=True); l[l == 0] = 1
    return (n / l).astype(np.float32)

# Shared vertex buffer across primitives so seams stay welded per (v,t)
key2new = {}; new_v = []; new_t = []
prim_idx = {}
for mat, tris in prims.items():
    idx = []
    for tri in tris:
        for vi, ti in tri:
            k = (vi, ti)
            if k not in key2new:
                key2new[k] = len(new_v); new_v.append(vi); new_t.append(ti)
            idx.append(key2new[k])
    prim_idx[mat] = np.array(idx, dtype=np.uint32)
new_v = np.array(new_v); new_t = np.array(new_t)
POS = V[new_v].astype(np.float32)
UV = np.where(new_t[:, None] >= 0, VT[np.maximum(new_t, 0)], 0).astype(np.float32)
UV[:, 1] = 1.0 - UV[:, 1]
# normals computed on the welded original-vertex topology to avoid seam creases
all_idx_orig = np.concatenate([new_v[prim_idx[m]] for m in prim_idx])
NRM_orig = compute_normals(V.astype(np.float32), all_idx_orig)
NRM = NRM_orig[new_v]
JOI = JI[new_v]; WEI = JW[new_v]
# Procedural eye colouring via COLOR_0 (sclera / iris / pupil); everything else white
COL = np.ones((len(new_v), 4), dtype=np.float32)
eye_orig = sorted({vi for kind, cs in faces if kind == 'eye' for vi, _ in cs})
eye_set = np.zeros(nV, bool); eye_set[eye_orig] = True
for side_sign in (1, -1):
    ids = [v for v in eye_orig if np.sign(V[v, 0]) == side_sign]
    c = V[ids].mean(axis=0)
    for v in ids:
        d = normalize(V[v] - c); cz = d[2]
        col = [0.93, 0.92, 0.90] if cz < 0.86 else ([0.02, 0.02, 0.02] if cz > 0.975 else [0.22, 0.13, 0.07])
        if 0.84 < cz <= 0.86: col = [0.30, 0.25, 0.22]  # limbal ring
        eye_set[v] = True; per = col
        COL_val = np.array(per + [1.0], dtype=np.float32)
        for nv in np.where(new_v == v)[0]:
            COL[nv] = COL_val
MORPHS = [d[new_v] for d in morph_deltas]

# ---------------- GLB writer ----------------
bin_chunks = bytearray(); views = []; accessors = []
def add_view(data, target=None):
    global bin_chunks
    while len(bin_chunks) % 4: bin_chunks += b'\0'
    off = len(bin_chunks); bin_chunks += data
    v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
    if target: v['target'] = target
    views.append(v); return len(views) - 1
def add_acc(arr, ctype, typ, target=None, minmax=False, normalized=False):
    arr = np.ascontiguousarray(arr)
    a = {'bufferView': add_view(arr.tobytes(), target), 'componentType': ctype,
         'count': int(arr.shape[0]), 'type': typ}
    if minmax:
        a['min'] = arr.min(axis=0).tolist() if arr.ndim > 1 else [float(arr.min())]
        a['max'] = arr.max(axis=0).tolist() if arr.ndim > 1 else [float(arr.max())]
    if normalized: a['normalized'] = True
    accessors.append(a); return len(accessors) - 1

FLOAT, U16, U32 = 5126, 5123, 5125
ARRAY, ELEM = 34962, 34963
a_pos = add_acc(POS, FLOAT, 'VEC3', ARRAY, minmax=True)
a_nrm = add_acc(NRM, FLOAT, 'VEC3', ARRAY)
a_uv = add_acc(UV, FLOAT, 'VEC2', ARRAY)
a_j = add_acc(JOI.astype(np.uint16), U16, 'VEC4', ARRAY)
a_w = add_acc(WEI.astype(np.float32), FLOAT, 'VEC4', ARRAY)
a_c = add_acc(COL, FLOAT, 'VEC4', ARRAY)
a_m = [add_acc(m, FLOAT, 'VEC3', ARRAY, minmax=True) for m in MORPHS]

MATS = {  # NEURO wardrobe: obsidian suit; neutral skin; no decorative red/cyan
    'skin':  {'name': 'HF_Skin_Neutral', 'pbrMetallicRoughness': {'baseColorFactor': [0.48, 0.32, 0.24, 1], 'metallicFactor': 0.0, 'roughnessFactor': 0.6}},
    'suit':  {'name': 'HF_Suit_Obsidian', 'pbrMetallicRoughness': {'baseColorFactor': [0.020, 0.027, 0.039, 1], 'metallicFactor': 0.0, 'roughnessFactor': 0.62}},
    'eye':   {'name': 'HF_Eye', 'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0.0, 'roughnessFactor': 0.08}},
    'teeth': {'name': 'HF_Teeth', 'pbrMetallicRoughness': {'baseColorFactor': [0.86, 0.83, 0.76, 1], 'metallicFactor': 0.0, 'roughnessFactor': 0.35}},
    'mouth': {'name': 'HF_Mouth', 'pbrMetallicRoughness': {'baseColorFactor': [0.45, 0.18, 0.18, 1], 'metallicFactor': 0.0, 'roughnessFactor': 0.4}},
}
materials = []; primitives = []
for mat in ['suit', 'skin', 'eye', 'teeth', 'mouth']:
    if mat not in prim_idx: continue
    materials.append(MATS[mat])
    p = {'attributes': {'POSITION': a_pos, 'NORMAL': a_nrm, 'TEXCOORD_0': a_uv, 'JOINTS_0': a_j, 'WEIGHTS_0': a_w, **({'COLOR_0': a_c} if mat == 'eye' else {})},
         'indices': add_acc(prim_idx[mat], U32, 'SCALAR', ELEM), 'material': len(materials) - 1}
    if a_m:
        p['targets'] = [{'POSITION': a} for a in a_m]
    primitives.append(p)

# joints as nodes
nodes = []
def decompose(m):
    t = m[:3, 3]; R = m[:3, :3]
    # quaternion from rotation matrix (orthonormal)
    tr = np.trace(R)
    if tr > 0:
        s = math.sqrt(tr + 1.0) * 2; w = 0.25 * s
        x = (R[2, 1] - R[1, 2]) / s; y = (R[0, 2] - R[2, 0]) / s; z = (R[1, 0] - R[0, 1]) / s
    elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
        s = math.sqrt(1.0 + R[0, 0] - R[1, 1] - R[2, 2]) * 2; w = (R[2, 1] - R[1, 2]) / s
        x = 0.25 * s; y = (R[0, 1] + R[1, 0]) / s; z = (R[0, 2] + R[2, 0]) / s
    elif R[1, 1] > R[2, 2]:
        s = math.sqrt(1.0 + R[1, 1] - R[0, 0] - R[2, 2]) * 2; w = (R[0, 2] - R[2, 0]) / s
        x = (R[0, 1] + R[1, 0]) / s; y = 0.25 * s; z = (R[1, 2] + R[2, 1]) / s
    else:
        s = math.sqrt(1.0 + R[2, 2] - R[0, 0] - R[1, 1]) * 2; w = (R[1, 0] - R[0, 1]) / s
        x = (R[0, 2] + R[2, 0]) / s; y = (R[1, 2] + R[2, 1]) / s; z = 0.25 * s
    q = np.array([x, y, z, w]); q /= np.linalg.norm(q)
    return [float(v) for v in t], [float(v) for v in q]
for i, n in enumerate(order):
    t, q = decompose(RestR[i])
    node = {'name': n, 'translation': t, 'rotation': q}
    kids = [bidx[c] for c in sorted(children.get(n, []))]
    if kids: node['children'] = kids
    nodes.append(node)
ibm = np.array([np.linalg.inv(RestG[i]).T.reshape(-1) for i in range(len(order))], dtype=np.float32)
a_ibm = add_acc(ibm, FLOAT, 'MAT4')
mesh_node = len(nodes)
mesh = {'name': 'HF_Actor_Body', 'primitives': primitives}
if morph_names:
    mesh['extras'] = {'targetNames': morph_names}
    mesh['weights'] = [0.0] * len(morph_names)
nodes.append({'name': 'HF_Actor_Body', 'mesh': 0, 'skin': 0})
root_node = len(nodes)
nodes.append({'name': 'HF_Actor', 'children': [bidx[r] for r in roots] + [mesh_node],
              'extras': {'actorId': 'hf-actor-0001', 'identity': 'synthetic-generic (MakeHuman CC0 base mesh hm08, no real-person likeness)',
                         'labels': ['SIMULATED-ACTOR'], 'builder': 'GROK-02 HUMAN FORGE build_actor.py'}})
gltf = {
    'asset': {'version': '2.0', 'generator': 'AGENTROPOLIS HUMAN FORGE build_actor.py',
              'copyright': 'Derived from MakeHuman 1.1 assets (CC0 1.0). Build script original.'},
    'scene': 0, 'scenes': [{'nodes': [root_node]}], 'nodes': nodes, 'meshes': [mesh],
    'skins': [{'name': 'HF_Skeleton_MH163', 'joints': list(range(len(order))), 'inverseBindMatrices': a_ibm, 'skeleton': bidx[roots[0]]}],
    'materials': materials, 'accessors': accessors, 'bufferViews': views,
    'buffers': [{'byteLength': len(bin_chunks)}],
}
js = json.dumps(gltf, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(bin_chunks) % 4: bin_chunks += b'\0'
total = 12 + 8 + len(js) + 8 + len(bin_chunks)
with open(OUT, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, total))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(bin_chunks), 0x004E4942)); f.write(bin_chunks)
print(json.dumps({'out': OUT, 'bytes': total, 'vertices': int(len(POS)), 'triangles': int(sum(len(v) for v in prim_idx.values()) // 3),
                  'joints': len(order), 'morphTargets': len(morph_names), 'materials': [m['name'] for m in materials],
                  'heightMeters': float(POS[:, 1].max()), 'morphNames': morph_names}, indent=1))
