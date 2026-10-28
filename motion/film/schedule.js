// node motion/film/schedule.js <장면id> '<옵션 JSON>' → 영상 총 길이(초). film.html과 같은 계산.
global.window = global;
global.document = { currentScript: null, addEventListener() {}, querySelector() { return null; } };
global.matchMedia = () => ({ matches: false });
const path = require('path');
require(path.join(__dirname, '..', 'motion.js'));
require(path.join(__dirname, '..', 'scenes', process.argv[2] + '.js'));
const def = window.NoriMotion.get(process.argv[2]);
const IN = JSON.parse(process.argv[3] || '{}');
const opt = {};
(def.options || []).forEach(o => {
  const hit = o.choices.find(c => String(c.value) === String(IN[o.key]));
  opt[o.key] = hit ? hit.value : (o.value != null ? o.value : o.choices[0].value);
});
const steps = (def.stepsFor ? def.stepsFor(opt) : def.steps).slice().sort((a, b) => a.at - b.at);
const dur = def.durationFor ? def.durationFor(opt) : def.duration;
let f0 = 0.6;
steps.forEach((s, i) => {
  const a = s.at, b = i + 1 < steps.length ? steps[i + 1].at : dur;
  const play = Math.max(0.01, (b - a) / 0.55);
  const chars = (s.text || '').replace(/\*\*/g, '').length;
  f0 += Math.max(4.5, play + 1.2, chars / 8.5 + 1.2);
});
console.log(Math.round((f0 + 1.2) * 10) / 10);
