// ============ ONBOARDING ============
let onboardingSlide = 0;
function nextOnboardingSlide() {
  if (onboardingSlide >= 3) { finishOnboarding(); return; }
  const cur = document.querySelector(`.onboarding-slide[data-slide="${onboardingSlide}"]`);
  cur.classList.remove('active');
  cur.classList.add('left');
  onboardingSlide++;
  document.querySelector(`.onboarding-slide[data-slide="${onboardingSlide}"]`).classList.add('active');
  $$('.onboarding-dot').forEach(d => d.classList.remove('active'));
  document.querySelector(`.onboarding-dot[data-dot="${onboardingSlide}"]`).classList.add('active');
  if (onboardingSlide === 3) el('onboardingNext').textContent = '开始使用';
}
function finishOnboarding() {
  el('onboarding').classList.remove('show');
  localStorage.setItem('sd_onboarded', '1');
}
