/**
 * settings.js
 * YouTube API 키 + 바른(Bareun) API 키 관리 (localStorage)
 */
const Settings = (() => {
  const YT_KEY     = 'yt_api_key';
  const BAREUN_KEY = 'bareun_api_key';

  function getKey()      { return localStorage.getItem(YT_KEY)     || ''; }
  function getBareunKey(){ return localStorage.getItem(BAREUN_KEY) || ''; }

  function openModal() {
    const modal  = document.getElementById('settings-modal');
    const input  = document.getElementById('input-api-key');
    const status = document.getElementById('api-key-status');

    // YouTube 키 표시
    const saved = getKey();
    input.value = saved;
    input.type  = 'password';
    document.getElementById('btn-toggle-key').textContent = '👁';
    status.innerHTML = saved
      ? `<span class="text-emerald-400">✅ 저장됨 (${maskKey(saved)})</span>`
      : `<span style="color:var(--warning)">⚠️ 키가 없습니다. 입력 후 저장하세요.</span>`;

    // 바른 API 키 표시
    const bareunInput  = document.getElementById('input-bareun-key');
    const bareunStatus = document.getElementById('bareun-key-status');
    const savedBareun  = getBareunKey();
    if (bareunInput)  { bareunInput.value = savedBareun; bareunInput.type = 'password'; }
    if (document.getElementById('btn-toggle-bareun'))
      document.getElementById('btn-toggle-bareun').textContent = '👁';
    if (bareunStatus) {
      bareunStatus.innerHTML = savedBareun
        ? `<span class="text-emerald-400">✅ 저장됨 (${maskKey(savedBareun)})</span>`
        : `<span style="color:var(--text-muted)">미입력 (선택 사항)</span>`;
    }

    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 100);
  }

  function closeModal() {
    document.getElementById('settings-modal').classList.add('hidden');
  }

  function saveKey() {
    const key       = document.getElementById('input-api-key').value.trim();
    const bareunKey = document.getElementById('input-bareun-key')?.value.trim() || '';

    if (!key) { App.showToast('YouTube API 키를 입력해주세요.', 'error'); return; }
    if (!key.startsWith('AIza')) App.showToast('키 형식을 확인하세요. (보통 AIza로 시작)', 'info');

    localStorage.setItem(YT_KEY, key);
    if (bareunKey) localStorage.setItem(BAREUN_KEY, bareunKey);
    else           localStorage.removeItem(BAREUN_KEY);

    closeModal();
    App.showToast('설정이 저장되었습니다.', 'success');
    App.updateHeaderKeyStatus();
    App.renderCurrentStep();
  }

  function toggleKeyVisibility() {
    const input = document.getElementById('input-api-key');
    const btn   = document.getElementById('btn-toggle-key');
    if (input.type === 'password') { input.type = 'text';     btn.textContent = '🙈'; }
    else                           { input.type = 'password'; btn.textContent = '👁';  }
  }

  function toggleBareunKeyVisibility() {
    const input = document.getElementById('input-bareun-key');
    const btn   = document.getElementById('btn-toggle-bareun');
    if (!input) return;
    if (input.type === 'password') { input.type = 'text';     btn.textContent = '🙈'; }
    else                           { input.type = 'password'; btn.textContent = '👁';  }
  }

  function maskKey(key) {
    if (!key || key.length < 8) return '****';
    return key.slice(0, 6) + '...' + key.slice(-4);
  }

  // ESC 키 / 모달 외부 클릭으로 닫기
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.getElementById('settings-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('settings-modal')) closeModal();
  });

  return { getKey, getBareunKey, openModal, closeModal, saveKey, toggleKeyVisibility, toggleBareunKeyVisibility };
})();
