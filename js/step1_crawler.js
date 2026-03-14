/**
 * step1_crawler.js — YouTube 댓글 수집
 */
const Step1 = (() => {

  let isCancelled = false;

  // ── UI 렌더링 ──────────────────────────────────────
  function render() {
    const apiKey = Settings.getKey();

    document.getElementById('step-container').innerHTML = `
      <!-- API 키 경고 -->
      ${!apiKey ? `
      <div class="card mt-4 mb-4" style="border-color:rgba(245,158,11,0.35);background:rgba(245,158,11,0.07);">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <p class="font-bold text-amber-300 text-sm">YouTube API 키가 설정되지 않았습니다.</p>
            <p class="text-amber-400/70 text-xs mt-0.5">우측 상단 ⚙️ 설정에서 API 키를 먼저 입력해주세요.</p>
          </div>
          <button onclick="Settings.openModal()" class="btn-ghost ml-auto px-4 py-2 rounded-xl text-sm font-bold" style="border-color:rgba(245,158,11,0.35);color:#fbbf24;">
            키 입력하기
          </button>
        </div>
      </div>` : ''}

      <!-- 수집 설정 카드 -->
      <div class="card mt-4">
        <h2 class="card-title">🔗 영상 URL 입력</h2>

        <div class="flex gap-2 mb-5">
          <input
            id="input-video-url"
            type="text"
            placeholder="https://www.youtube.com/watch?v=... 또는 Video ID"
            class="input-base flex-1"
            onkeydown="if(event.key==='Enter') Step1.startFetch()"
          />
          <button
            id="btn-fetch"
            onclick="Step1.startFetch()"
            class="btn-accent px-5 py-2 rounded-xl font-bold text-base whitespace-nowrap"
            ${!apiKey ? 'disabled' : ''}
          >
            댓글 수집
          </button>
        </div>

        <!-- 수집 옵션 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- 정렬 -->
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:var(--text-secondary)">정렬 기준</label>
            <div class="flex gap-2">
              <label class="option-chip">
                <input type="radio" name="sort-order" value="relevance" checked class="hidden" />
                <span>인기순</span>
              </label>
              <label class="option-chip">
                <input type="radio" name="sort-order" value="time" class="hidden" />
                <span>최신순</span>
              </label>
            </div>
          </div>

          <!-- 최대 수집 수 -->
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:var(--text-secondary)">최대 수집 수</label>
            <div class="flex gap-1 flex-wrap">
              ${[100, 300, 500, '최대'].map((v, i) => `
                <label class="option-chip">
                  <input type="radio" name="max-count" value="${v}" ${i===2?'checked':''} class="hidden" />
                  <span>${v}${v!=='최대'?'개':''}</span>
                </label>`).join('')}
            </div>
          </div>

          <!-- 대댓글 포함 -->
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:var(--text-secondary)">대댓글</label>
            <label class="toggle-wrap">
              <input type="checkbox" id="chk-replies" />
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="text-sm font-medium" style="color:var(--text-secondary)">대댓글 포함</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 진행 상태 (기본 숨김) -->
      <div id="fetch-progress" class="card mt-4 hidden">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="spinner"></span>
            <span id="progress-text" class="font-semibold text-sm" style="color:var(--text-secondary)">수집 중...</span>
          </div>
          <button onclick="Step1.cancelFetch()" class="btn-danger px-3 py-1 rounded-lg text-sm">중단</button>
        </div>
        <div class="progress-bar-track">
          <div id="progress-fill" class="progress-bar-fill" style="width:0%"></div>
        </div>
        <p id="progress-count" class="text-xs mt-2" style="color:var(--text-muted)">0개 수집됨</p>
      </div>

      <!-- 결과 영역 -->
      <div id="result-area" class="hidden">
        <!-- 요약 -->
        <div class="card mt-4" style="background:rgba(99,102,241,0.07);border-color:rgba(99,102,241,0.25);">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">✅</span>
              <div>
                <p id="result-summary" class="font-bold text-white text-base"></p>
                <p id="result-video-title" class="text-sm mt-0.5" style="color:var(--text-secondary)"></p>
              </div>
            </div>
            <button onclick="Step1.downloadCSV()" class="btn-ghost px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <span>📥</span> CSV 저장
            </button>
          </div>
        </div>

        <!-- 댓글 테이블 -->
        <div class="card mt-3">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-base" style="color:var(--text-primary)">수집된 댓글</h3>
            <input
              id="table-search"
              type="text"
              placeholder="댓글 검색..."
              class="input-base"
              style="width:200px;font-size:13px;padding:7px 12px;"
              oninput="Step1.filterTable(this.value)"
            />
          </div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:44px">#</th>
                  <th>댓글 내용</th>
                  <th style="width:110px">작성자</th>
                  <th style="width:70px">👍</th>
                  <th style="width:100px">날짜</th>
                  <th style="width:60px">유형</th>
                </tr>
              </thead>
              <tbody id="comments-tbody"></tbody>
            </table>
          </div>
          <p id="table-count" class="text-xs mt-2" style="color:var(--text-muted)"></p>
        </div>
      </div>
    `;

    // 라디오 버튼 스타일 초기화
    initOptionChips();
  }

  // ── 옵션 칩 스타일 초기화 ──────────────────────────
  function initOptionChips() {
    document.querySelectorAll('.option-chip input').forEach(input => {
      updateChip(input);
      input.addEventListener('change', () => {
        document.querySelectorAll(`input[name="${input.name}"]`).forEach(i => updateChip(i));
      });
    });
  }

  function updateChip(input) {
    const span = input.nextElementSibling;
    if (input.checked) {
      span.style.cssText = 'background:var(--accent);color:white;border-color:var(--accent);box-shadow:0 0 10px var(--accent-glow);';
    } else {
      span.style.cssText = 'background:var(--glass-bg);color:var(--text-secondary);border-color:var(--glass-border);';
    }
  }

  // ── 댓글 수집 시작 ────────────────────────────────
  async function startFetch() {
    const apiKey = Settings.getKey();
    if (!apiKey) { App.showToast('API 키를 먼저 설정해주세요.', 'error'); Settings.openModal(); return; }

    const urlInput = document.getElementById('input-video-url').value.trim();
    if (!urlInput) { App.showToast('YouTube URL 또는 Video ID를 입력해주세요.', 'error'); return; }

    const videoId = Utils.extractVideoId(urlInput);
    if (!videoId) { App.showToast('올바른 YouTube URL 또는 Video ID가 아닙니다.', 'error'); return; }

    const order       = document.querySelector('input[name="sort-order"]:checked')?.value || 'relevance';
    const maxRaw      = document.querySelector('input[name="max-count"]:checked')?.value || '500';
    const maxCount    = maxRaw === '최대' ? Infinity : parseInt(maxRaw);
    const withReplies = document.getElementById('chk-replies')?.checked || false;

    // UI: 수집 시작
    isCancelled = false;
    document.getElementById('btn-fetch').disabled = true;
    document.getElementById('fetch-progress').classList.remove('hidden');
    document.getElementById('result-area').classList.add('hidden');

    try {
      const { comments, videoTitle } = await collectComments(apiKey, videoId, order, maxCount, withReplies);

      if (isCancelled) {
        App.showToast(`수집이 중단되었습니다. (${comments.length}개 수집됨)`, 'info');
      } else {
        App.showToast(`${comments.length.toLocaleString()}개 댓글 수집 완료!`, 'success');
      }

      // 전역 상태 저장
      App.state.comments = comments;
      App.completeStep(0);

      renderResults(comments, videoTitle);

    } catch (err) {
      handleApiError(err);
    } finally {
      document.getElementById('btn-fetch').disabled = false;
      document.getElementById('fetch-progress').classList.add('hidden');
    }
  }

  // ── HTML 엔티티 디코딩 (&#39; → ' 등) ─────────────
  function decodeHtml(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }

  // ── 댓글 텍스트 정제 ──────────────────────────────
  function parseText(raw) {
    return decodeHtml(raw.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
  }

  // ── 댓글 수집 핵심 로직 ───────────────────────────
  async function collectComments(apiKey, videoId, order, maxCount, withReplies) {
    const comments = [];
    let pageToken = '';
    let page = 0;
    let videoTitle = '';

    while (true) {
      if (isCancelled) break;

      const params = new URLSearchParams({
        part: 'snippet,replies',
        videoId,
        maxResults: 100,
        order,
        key: apiKey,
        ...(pageToken ? { pageToken } : {}),
      });

      const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw { status: res.status, data: errData };
      }

      const data = await res.json();
      page++;

      // 최초 응답에서 영상 제목 추출 (없으면 Video ID 사용)
      if (!videoTitle) videoTitle = videoId;

      // 댓글 파싱
      for (const item of data.items || []) {
        if (isCancelled || comments.length >= maxCount) break;

        const top = item.snippet.topLevelComment.snippet;
        comments.push({
          type: '댓글',
          text: parseText(top.textDisplay),
          author: top.authorDisplayName,
          likes: top.likeCount || 0,
          date: Utils.formatDate(top.publishedAt),
          replyCount: item.snippet.totalReplyCount || 0,
        });

        // 대댓글 포함
        if (withReplies && item.replies?.comments) {
          for (const reply of item.replies.comments) {
            if (isCancelled || comments.length >= maxCount) break;
            const r = reply.snippet;
            comments.push({
              type: '대댓글',
              text: parseText(r.textDisplay),
              author: r.authorDisplayName,
              likes: r.likeCount || 0,
              date: Utils.formatDate(r.publishedAt),
              replyCount: 0,
            });
          }
        }
      }

      // 진행 상태 업데이트
      updateProgress(comments.length, maxCount, page, !!data.nextPageToken);

      // 다음 페이지 여부
      if (!data.nextPageToken || comments.length >= maxCount || isCancelled) break;
      pageToken = data.nextPageToken;
    }

    return { comments, videoTitle };
  }

  // ── 진행 상태 업데이트 ────────────────────────────
  function updateProgress(collected, maxCount, page, hasMore) {
    const text   = document.getElementById('progress-text');
    const fill   = document.getElementById('progress-fill');
    const count  = document.getElementById('progress-count');

    const pct = maxCount === Infinity
      ? (hasMore ? Math.min(page * 10, 90) : 100)
      : Math.min((collected / maxCount) * 100, 100);

    fill.style.width = pct + '%';
    text.textContent = hasMore ? `수집 중... (${page}페이지)` : '수집 완료';
    count.textContent = `${collected.toLocaleString()}개 수집됨`;
  }

  // ── 수집 취소 ─────────────────────────────────────
  function cancelFetch() { isCancelled = true; }

  // ── API 오류 처리 ──────────────────────────────────
  function handleApiError(err) {
    const status = err?.status;
    const reason = err?.data?.error?.errors?.[0]?.reason || '';
    const msg    = err?.data?.error?.message || '';

    let ko = '';
    if (status === 403) {
      if (reason === 'quotaExceeded')      ko = '오늘의 API 할당량이 초과되었습니다. 내일 다시 시도하거나 새 API 키를 발급받으세요.';
      else if (reason === 'forbidden')     ko = '댓글이 비활성화된 영상이거나 접근이 제한되어 있습니다.';
      else if (msg.includes('API key'))    ko = 'API 키가 올바르지 않습니다. 설정에서 키를 확인해주세요.';
      else                                 ko = `접근이 거부되었습니다. (${reason || '403'})`;
    } else if (status === 400) {
      ko = 'API 요청이 올바르지 않습니다. Video ID를 다시 확인해주세요.';
    } else if (status === 404) {
      ko = '영상을 찾을 수 없습니다. URL을 다시 확인해주세요.';
    } else if (!navigator.onLine) {
      ko = '인터넷 연결이 없습니다. 네트워크를 확인해주세요.';
    } else {
      ko = `오류가 발생했습니다. (${status || '네트워크 오류'})`;
    }

    document.getElementById('step-container').insertAdjacentHTML('afterbegin', `
      <div class="card mb-4" style="border-color:rgba(244,63,94,0.35);background:rgba(244,63,94,0.07);">
        <div class="flex items-start gap-3">
          <span class="text-2xl mt-0.5">❌</span>
          <div class="flex-1">
            <p class="font-bold text-red-400 text-sm">수집 실패</p>
            <p class="text-red-400/80 text-sm mt-1">${Utils.escapeHtml(ko)}</p>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-red-400/50 hover:text-red-400 text-lg">&times;</button>
        </div>
      </div>
    `);
    App.showToast('댓글 수집에 실패했습니다.', 'error');
  }

  // ── 결과 테이블 렌더링 ────────────────────────────
  function renderResults(comments, videoTitle) {
    document.getElementById('result-area').classList.remove('hidden');
    document.getElementById('result-summary').textContent =
      `총 ${comments.length.toLocaleString()}개 댓글 수집 완료`;
    document.getElementById('result-video-title').textContent =
      `Video ID: ${videoTitle}`;

    renderTable(comments);
  }

  function renderTable(comments) {
    const tbody = document.getElementById('comments-tbody');
    const countEl = document.getElementById('table-count');

    if (!comments.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8" style="color:var(--text-muted)">댓글이 없습니다.</td></tr>`;
      countEl.textContent = '';
      return;
    }

    tbody.innerHTML = comments.slice(0, 300).map((c, i) => `
      <tr>
        <td class="font-mono text-xs" style="color:var(--text-muted)">${i + 1}</td>
        <td class="max-w-xs">
          <p class="line-clamp-2 text-sm leading-relaxed">${Utils.escapeHtml(c.text)}</p>
        </td>
        <td class="text-sm" style="color:var(--text-secondary)">${Utils.escapeHtml(c.author)}</td>
        <td class="text-sm text-center">${c.likes.toLocaleString()}</td>
        <td class="text-xs" style="color:var(--text-muted)">${c.date}</td>
        <td>
          <span class="badge ${c.type === '댓글' ? 'badge-accent' : 'badge-warning'}">${c.type}</span>
        </td>
      </tr>
    `).join('');

    const showing = Math.min(comments.length, 300);
    countEl.textContent = comments.length > 300
      ? `테이블에 ${showing}개 표시 중 (전체 ${comments.length.toLocaleString()}개 — CSV로 전체 확인 가능)`
      : `${comments.length.toLocaleString()}개 표시 중`;
  }

  // ── 테이블 검색 필터 ──────────────────────────────
  function filterTable(query) {
    const comments = App.state.comments;
    if (!query.trim()) { renderTable(comments); return; }
    const q = query.toLowerCase();
    const filtered = comments.filter(c =>
      c.text.toLowerCase().includes(q) || c.author.toLowerCase().includes(q)
    );
    renderTable(filtered);
    document.getElementById('table-count').textContent =
      `"${query}" 검색 결과: ${filtered.length.toLocaleString()}개`;
  }

  // ── CSV 다운로드 ──────────────────────────────────
  function downloadCSV() {
    const comments = App.state.comments;
    if (!comments.length) { App.showToast('수집된 댓글이 없습니다.', 'error'); return; }

    const rows = [
      ['순번', '유형', '댓글 내용', '작성자', '좋아요', '날짜'],
      ...comments.map((c, i) => [i + 1, c.type, c.text, c.author, c.likes, c.date]),
    ];
    Utils.downloadCSV(rows, `youtube_comments_${Utils.timestamp()}.csv`);
    App.showToast('CSV 파일을 저장했습니다.', 'success');
  }

  return { render, startFetch, cancelFetch, filterTable, downloadCSV };

})();
