/* AGENTROPOLIS Anatomy X explainer player v0.1.0
 * Visual teaching component. Never a source of truth or execution authority.
 * Designed for standalone HTML, React and public GitHub Pages.
 * No network, dependencies, tracking, external media, or automatic audio.
 * This is an AGENTROPOLIS original; upstream Anatomy kit is NOT bundled.
 */
(function () {
  "use strict";
  if (typeof window === "undefined" || !window.customElements || customElements.get("agt-explainer")) return;

  var PRESETS = {
    governance: {
      id: "governance", title: "How an AI agent gets permission", note: "Conceptual demonstration, not live authorization.",
      steps: [
        { title: "Identity", caption: "The agent presents its registered identity.", narration: "First, an agent must establish its identity.", status: "IDENTITY CHECK" },
        { title: "Mandate", caption: "A human-approved mission defines its permitted purpose.", narration: "Next, the mission must be authorized by the right people.", status: "MANDATE REQUIRED" },
        { title: "Plan and policy", caption: "Policy checks the proposed plan, tools and jurisdiction.", narration: "Policy checks what the agent is allowed to do.", status: "POLICY GATE" },
        { title: "Bounded execution", caption: "Only permitted actions pass into the execution envelope.", narration: "Only approved actions can enter the execution envelope.", status: "CONTROLLED ACTION" },
        { title: "Receipt and audit", caption: "Evidence and independent review follow execution.", narration: "Every consequential action should produce a receipt for audit.", status: "EVIDENCE REQUIRED" }
      ]
    },
    atlas: {
      id: "atlas", title: "How ATLAS checks a location", note: "Read-plane example. No live location or permission decisions.",
      steps: [
        { title: "Find the place", caption: "ATLAS resolves coordinates and names using attributed spatial data.", narration: "ATLAS starts by finding the place.", status: "SPATIAL EVIDENCE" },
        { title: "Check jurisdiction", caption: "Geography does not itself grant authority.", narration: "A location alone does not give an agent permission to act.", status: "JURISDICTION" },
        { title: "Inspect resources", caption: "Relevant infrastructure is identified without exposing private operations.", narration: "Next, ATLAS examines the resources in that area.", status: "READ ONLY" },
        { title: "Evaluate boundaries", caption: "Mandate and policy determine which routes, if any, are allowed.", narration: "Policy determines whether a route is actually permitted.", status: "POLICY REQUIRED" },
        { title: "Issue spatial evidence", caption: "A spatial receipt records source, time, area, confidence and attribution.", narration: "Finally, ATLAS records where the evidence came from.", status: "RECEIPT" }
      ]
    },
    world: {
      id: "world", title: "Explore the AGENTROPOLIS World", note: "Conceptual tour. Renderer state does not create authority.",
      steps: [
        { title: "Enter the globe", caption: "The globe is the orientation layer for top-level districts.", narration: "Start at the globe to find the city's districts.", status: "ORIENTATION" },
        { title: "Choose a district", caption: "Each institution owns a bounded domain, not the entire grid.", narration: "Each district has a specific purpose.", status: "DISTRICT" },
        { title: "Inspect a building", caption: "Buildings can represent repositories or public operational concepts.", narration: "Explore buildings to understand which system does what.", status: "PUBLIC VIEW" },
        { title: "Follow a mission", caption: "Public manifestations of activity must be distinguished from live verified state.", narration: "A visual status does not prove an action happened.", status: "VERIFY STATE" },
        { title: "Trace the receipt", caption: "The private control plane remains separate from the public world renderer.", narration: "Evidence and authority stay with the governed control plane.", status: "AUDIT BOUNDARY" }
      ]
    }
  };
  var STYLE = ':host{display:block;color:#e9f7f7;font:14px/1.55 Inter,system-ui,sans-serif}*{box-sizing:border-box}.frame{border:1px solid #24515a;border-radius:14px;background:linear-gradient(145deg,#07131b,#05070a);padding:clamp(14px,3vw,26px);max-width:100%;box-shadow:0 12px 34px #0005}.top{display:flex;justify-content:space-between;gap:10px;align-items:center}.tag{color:#19e6e6;font:700 10px ui-monospace,monospace;letter-spacing:.12em}.count{font:11px ui-monospace,monospace;color:#91aeb5}h2{font-size:clamp(19px,3vw,26px);line-height:1.15;margin:12px 0}p{margin:8px 0;max-width:64ch}.note{color:#bbabb0;font-size:12px}.stage{min-height:115px;display:grid;align-content:center;gap:12px;margin:16px 0;border:1px solid #173c48;background:radial-gradient(ellipse at 50% 50%,#0a2835,#051017 70%);padding:18px;border-radius:10px}.track{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));list-style:none;margin:0;padding:0;gap:6px}.track li{height:34px;border:1px solid #24515a;border-radius:6px;display:grid;place-items:center;background:#09121c;font:700 11px ui-monospace,monospace;color:#819fa5}.track li[aria-current=step]{background:#10323d;border:2px solid #19e6e6;color:#e6ffff;box-shadow:0 0 18px #19e6e626}.track li.done{border-color:#19e6e6;color:#19e6e6}.state{color:#19e6e6;font:700 11px ui-monospace,monospace;letter-spacing:.12em}.caption{min-height:46px;color:#e9f7f7}.narration{color:#bdd5d8;font-size:12px}button{border:1px solid #19e6e6;border-radius:7px;background:#08222c;color:#e9ffff;min-height:42px;padding:9px 12px;font:700 12px system-ui;cursor:pointer}button[disabled]{opacity:.45;cursor:not-allowed}button:focus-visible{outline:3px solid white;outline-offset:3px}.controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.controls button.primary{background:#19e6e6;color:#071018}.warning{margin-top:14px;color:#9fb2b9;font-size:11px;border-top:1px solid #17323a;padding-top:12px}.progress{height:4px;background:#17323a;border-radius:999px;overflow:hidden}.progress span{height:100%;display:block;background:#19e6e6;transition:width .2s linear}@media(prefers-reduced-motion:reduce){.progress span{transition:none}}@media(max-width:480px){.controls button{flex:1 1 42%}.frame{padding:13px}}';
  function clean(value, max) { return String(value == null ? "" : value).slice(0, max); }
  function prepare(raw) {
    if (!raw || !Array.isArray(raw.steps) || !raw.steps.length || raw.steps.length > 12) return null;
    return {
      id: clean(raw.id, 64), title: clean(raw.title, 110),
      note: clean(raw.note || "Illustrative lesson, not verified runtime state.", 220),
      steps: raw.steps.map(function (s) {
        return { title: clean(s.title, 80), caption: clean(s.caption, 320),
          narration: clean(s.narration || s.caption, 320), status: clean(s.status || "EXPLANATION", 40),
          seconds: Math.max(3, Math.min(30, Number(s.seconds) || 10)) };
      })
    };
  }
  var Base = window.HTMLElement;
  class Explainer extends Base {
    connectedCallback() {
      if (this._mounted) return;
      this._mounted = true;
      this._index = 0;
      this._playing = false;
      this._voice = false;
      this._story = prepare(PRESETS[this.getAttribute("data-preset")] || PRESETS.governance);
      this.attachShadow({ mode: "open" });
      this.render();
    }
    disconnectedCallback() { this.stop(); }
    setStory(raw) {
      var next = prepare(raw);
      if (!next) return false;
      this.stop(); this._story = next; this._index = 0;
      if (this.shadowRoot) this.render();
      return true;
    }
    stop() {
      if (this._timer) clearTimeout(this._timer);
      this._timer = null;
      this._playing = false;
      if (this._utterance && window.speechSynthesis) window.speechSynthesis.cancel();
      this._utterance = null;
    }
    speak() {
      if (!this._voice || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(this._story.steps[this._index].narration);
      u.lang = "en-US"; u.rate = 0.95;
      this._utterance = u;
      window.speechSynthesis.speak(u);
    }
    schedule() {
      if (this._timer) clearTimeout(this._timer);
      if (!this._playing) return;
      var self = this;
      this._timer = setTimeout(function () {
        if (self._index >= self._story.steps.length - 1) { self.stop(); self.render(); return; }
        self._index += 1; self.render(); self.speak(); self.schedule();
      }, this._story.steps[this._index].seconds * 1000);
    }
    move(direction) {
      this._index = Math.max(0, Math.min(this._story.steps.length - 1, this._index + direction));
      if (this._timer) clearTimeout(this._timer);
      if (this._utterance && window.speechSynthesis) window.speechSynthesis.cancel();
      this.render(); this.speak(); this.schedule();
    }
    render() {
      var self = this, story = this._story, step = story.steps[this._index];
      if (!this.shadowRoot) return;
      this.shadowRoot.innerHTML = '<style>' + STYLE + '</style><section class="frame" aria-label="Visual-first guided explainer">' +
        '<div class="top"><span class="tag">ANATOMY X · GUIDED EXPLAINER</span><span class="count"></span></div>' +
        '<h2 class="title"></h2><div class="progress" aria-hidden="true"><span></span></div>' +
        '<div class="stage"><ol class="track" aria-label="Lesson progress"></ol><div class="state"></div></div>' +
        '<h3 class="heading" aria-live="polite"></h3><p class="caption"></p><p class="narration"></p>' +
        '<div class="controls"><button type="button" data-act="prev">Previous</button>' +
        '<button type="button" class="primary" data-act="play">Play lesson</button>' +
        '<button type="button" data-act="next">Next step</button><button type="button" data-act="voice">Enable voice</button></div>' +
        '<p class="warning"></p></section>';
      function put(selector, val) { self.shadowRoot.querySelector(selector).textContent = val; }
      put(".count", (this._index + 1) + " / " + story.steps.length);
      put(".title", story.title);
      put(".heading", step.title);
      put(".caption", step.caption);
      put(".state", step.status);
      put(".narration", "Narration: " + step.narration);
      put(".warning", story.note + " · Explainers do not grant authority or verify live status.");
      this.shadowRoot.querySelector(".progress span").style.width = (((this._index + 1) / story.steps.length) * 100) + "%";
      var track = this.shadowRoot.querySelector(".track");
      track.style.gridTemplateColumns = "repeat(" + story.steps.length + ",minmax(0,1fr))";
      story.steps.forEach(function (item, i) {
        var li = document.createElement("li");
        li.textContent = String(i + 1);
        li.setAttribute("aria-label", item.title);
        if (i === self._index) li.setAttribute("aria-current", "step");
        if (i < self._index) li.className = "done";
        track.appendChild(li);
      });
      var prev = this.shadowRoot.querySelector('[data-act="prev"]');
      var next = this.shadowRoot.querySelector('[data-act="next"]');
      var play = this.shadowRoot.querySelector('[data-act="play"]');
      var voice = this.shadowRoot.querySelector('[data-act="voice"]');
      prev.disabled = this._index === 0;
      next.disabled = this._index === story.steps.length - 1;
      play.textContent = this._playing ? "Pause lesson" : (this._index === story.steps.length - 1 ? "Replay lesson" : "Play lesson");
      voice.textContent = this._voice ? "Mute voice" : "Enable voice";
      voice.disabled = !window.speechSynthesis || !window.SpeechSynthesisUtterance;
      prev.addEventListener("click", function () { self.move(-1); });
      next.addEventListener("click", function () { self.move(1); });
      play.addEventListener("click", function () {
        if (self._playing) { self.stop(); self.render(); return; }
        if (self._index === story.steps.length - 1) self._index = 0;
        self._playing = true; self.render(); self.speak(); self.schedule();
      });
      voice.addEventListener("click", function () {
        self._voice = !self._voice;
        if (self._voice) self.speak();
        else if (window.speechSynthesis) window.speechSynthesis.cancel();
        self.render();
      });
    }
  }
  customElements.define("agt-explainer", Explainer);
  window.AGENTROPOLIS_ANATOMY_X = Object.freeze({ version: "0.1.0", presets: Object.keys(PRESETS), validateStory: prepare });
})();