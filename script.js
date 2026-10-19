/**
 * 초등 학급 숙제 및 가정통신문 제출 여부 확인 프로그램
 * Pure Vanilla JavaScript (No build required, 100% GitHub Pages compatible)
 */

(function () {
  'use strict';

  // --- Initial Default Data ---
  const DEFAULT_STUDENTS = [
    '김민준', '이서아', '박도윤', '정지우', '최하은',
    '강시우', '조유나', '윤서준', '장채원', '임도현',
    '한수아', '오은우', '서지유', '신지후', '권예린',
    '황준서', '안다은', '송민우', '류소율', '백하율'
  ];

  const DEFAULT_TASKS = [
    '가정통신문 (현장체험학습 동의서)',
    '수학익힘책 (42~45쪽)',
    '주말 일기장',
    '독서록 기록장'
  ];

  // --- State ---
  let state = {
    grade: '3',
    classNum: '2',
    tasks: [...DEFAULT_TASKS],
    currentTaskIndex: 0,
    students: DEFAULT_STUDENTS.map((name, idx) => ({ id: idx + 1, num: idx + 1, name })),
    // submissions[taskName] = array of student numbers/ids
    submissions: {},
    soundEnabled: true,
    filterText: ''
  };

  // --- LocalStorage Persistence ---
  const STORAGE_KEY = 'elementary_school_check_board_v1';

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        grade: state.grade,
        classNum: state.classNum,
        tasks: state.tasks,
        currentTaskIndex: state.currentTaskIndex,
        students: state.students,
        submissions: state.submissions,
        soundEnabled: state.soundEnabled
      }));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          state.grade = parsed.grade || state.grade;
          state.classNum = parsed.classNum || state.classNum;
          if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
            state.tasks = parsed.tasks;
          }
          state.currentTaskIndex = typeof parsed.currentTaskIndex === 'number' ? parsed.currentTaskIndex : 0;
          if (Array.isArray(parsed.students) && parsed.students.length > 0) {
            state.students = parsed.students;
          }
          if (parsed.submissions && typeof parsed.submissions === 'object') {
            state.submissions = parsed.submissions;
          }
          if (typeof parsed.soundEnabled === 'boolean') {
            state.soundEnabled = parsed.soundEnabled;
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
  }

  // Ensure current active task exists in submissions
  function getCurrentTaskName() {
    return state.tasks[state.currentTaskIndex] || '확인할 항목';
  }

  function getSubmittedSet() {
    const taskName = getCurrentTaskName();
    if (!state.submissions[taskName]) {
      state.submissions[taskName] = [];
    }
    return new Set(state.submissions[taskName]);
  }

  function setSubmittedList(idsArray) {
    const taskName = getCurrentTaskName();
    state.submissions[taskName] = idsArray;
    saveState();
  }

  // --- Cute Web Audio Sound Synthesizer (No external sound files required) ---
  let audioCtx = null;

  function playCuteSound(type) {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;

      if (type === 'submit') {
        // Bright pleasant two-tone pop/chime (C6 -> G6)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.08); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.16); // C6

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'unsubmit') {
        // Gentle downward woodblock pop
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'celebrate') {
        // Magical fanfare sequence
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const startTime = now + idx * 0.09;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.2, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.25);
        });
      }
    } catch (e) {
      // Audio not permitted yet or failed silently
    }
  }

  // --- Confetti Effect (Pure Canvas) ---
  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#fb7185', '#f43f5e', '#fcd34d', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];
    const particles = [];
    const count = 70;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1,
        shape: Math.random() > 0.5 ? 'heart' : 'rect'
      });
    }

    let animationFrameId;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.vRot;
        p.alpha -= 0.008;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          } else {
            // Heart shape
            ctx.beginPath();
            const topCurveHeight = p.size * 0.3;
            ctx.moveTo(0, topCurveHeight);
            ctx.bezierCurveTo(0, 0, -p.size / 2, 0, -p.size / 2, topCurveHeight);
            ctx.bezierCurveTo(-p.size / 2, (p.size + topCurveHeight) / 2, 0, (p.size + topCurveHeight) / 2, 0, p.size);
            ctx.bezierCurveTo(0, (p.size + topCurveHeight) / 2, p.size / 2, (p.size + topCurveHeight) / 2, p.size / 2, topCurveHeight);
            ctx.bezierCurveTo(p.size / 2, 0, 0, 0, 0, topCurveHeight);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationFrameId);
      }
    }

    render();
  }

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(message, isSuccess = false) {
    const toast = document.getElementById('cute-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'cute-toast show' + (isSuccess ? ' success' : '');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.className = 'cute-toast';
    }, 2400);
  }

  // --- DOM Elements ---
  const gradeInput = document.getElementById('grade-input');
  const classInput = document.getElementById('class-input');
  const studentsTextarea = document.getElementById('students-textarea');
  const studentCountBadge = document.getElementById('student-count-badge');
  const newTaskInput = document.getElementById('new-task-input');
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskChipsContainer = document.getElementById('task-chips-container');
  const taskTabsRow = document.getElementById('task-tabs-row');

  const boardGrade = document.getElementById('board-grade');
  const boardClass = document.getElementById('board-class');
  const currentTaskNameSpan = document.getElementById('current-task-name');

  const submittedCountEl = document.getElementById('submitted-count');
  const unsubmittedCountEl = document.getElementById('unsubmitted-count');
  const totalCountEl = document.getElementById('total-count');
  const submitPercentEl = document.getElementById('submit-percent');
  const progressFillEl = document.getElementById('progress-fill');
  const statMessageEl = document.getElementById('stat-message');

  const studentsGrid = document.getElementById('students-grid');
  const searchInput = document.getElementById('search-student-input');

  const settingsCard = document.getElementById('settings-card');
  const settingsToggleBtn = document.getElementById('toggle-settings-btn');
  const settingsArrow = document.getElementById('settings-arrow');

  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const printBtn = document.getElementById('print-btn');

  const checkAllBtn = document.getElementById('check-all-btn');
  const uncheckAllBtn = document.getElementById('uncheck-all-btn');
  const copyUnsubmittedBtn = document.getElementById('copy-unsubmitted-btn');

  // Modal elements
  const unsubmittedModal = document.getElementById('unsubmitted-modal');
  const unsubmittedModalClose = document.getElementById('modal-close-btn');
  const unsubmittedModalCancel = document.getElementById('modal-cancel-btn');
  const unsubmittedModalCopyAction = document.getElementById('modal-copy-action-btn');
  const unsubmittedTextarea = document.getElementById('unsubmitted-textarea');

  // --- Render Functions ---

  // Update Board Title and Top Input Values
  function updateBoardTitle() {
    boardGrade.textContent = state.grade || '3';
    boardClass.textContent = state.classNum || '2';
    document.title = `${state.grade}학년 ${state.classNum}반 확인 보드 | Apple 스타일`;
  }

  // Render Check Items List & Tabs (Apple Store Segmented Control style)
  function renderTasks() {
    if (state.tasks.length === 0) {
      state.tasks = ['제출물 확인'];
      state.currentTaskIndex = 0;
    }
    if (state.currentTaskIndex >= state.tasks.length) {
      state.currentTaskIndex = 0;
    }

    // 1. Settings Chips List
    taskChipsContainer.innerHTML = '';
    state.tasks.forEach((task, idx) => {
      const chip = document.createElement('div');
      chip.className = 'apple-task-tag task-chip';
      chip.innerHTML = `
        <span>📌 ${escapeHtml(task)}</span>
        <button type="button" class="apple-tag-remove task-chip-remove" title="항목 삭제" data-index="${idx}">✕</button>
      `;
      chip.querySelector('.apple-tag-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeTask(idx);
      });
      taskChipsContainer.appendChild(chip);
    });

    // 2. Active Tab Switcher on Board (Apple Segmented Picker)
    taskTabsRow.innerHTML = '';
    state.tasks.forEach((task, idx) => {
      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = 'segmented-btn task-tab-btn' + (idx === state.currentTaskIndex ? ' active' : '');
      tabBtn.textContent = (idx === state.currentTaskIndex ? '✓ ' : '') + task;
      tabBtn.addEventListener('click', () => {
        state.currentTaskIndex = idx;
        saveState();
        renderTasks();
        renderBoard();
      });
      taskTabsRow.appendChild(tabBtn);
    });

    currentTaskNameSpan.textContent = getCurrentTaskName();
  }

  function removeTask(index) {
    if (state.tasks.length <= 1) {
      showToast('⚠️ 최소 하나 이상의 확인 항목이 필요해요.');
      return;
    }
    const removedTask = state.tasks[index];
    state.tasks.splice(index, 1);
    delete state.submissions[removedTask];
    if (state.currentTaskIndex >= state.tasks.length) {
      state.currentTaskIndex = state.tasks.length - 1;
    }
    saveState();
    renderTasks();
    renderBoard();
    showToast('🗑️ 확인 항목을 삭제했습니다.');
  }

  function addNewTask(taskName) {
    const trimmed = taskName.trim();
    if (!trimmed) return;
    if (state.tasks.includes(trimmed)) {
      showToast('이미 등록된 항목이에요! 해당 항목으로 전환합니다.');
      state.currentTaskIndex = state.tasks.indexOf(trimmed);
      renderTasks();
      renderBoard();
      return;
    }
    state.tasks.push(trimmed);
    state.currentTaskIndex = state.tasks.length - 1;
    saveState();
    renderTasks();
    renderBoard();
    showToast(`✨ 새 항목 "${trimmed}"이(가) 추가되었습니다!`, true);
  }

  // Parse Student Names Textarea
  function parseStudentsFromText(text) {
    const rawLines = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const parsed = [];
    let autoNum = 1;

    rawLines.forEach((item) => {
      // Matches pattern like "1. 홍길동" or "1번 홍길동" or "홍길동"
      const match = item.match(/^(\d+)[번\.\s\)\-]*(.+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        const name = match[2].trim();
        if (name) {
          parsed.push({ id: num, num: num, name });
          autoNum = num + 1;
        }
      } else {
        parsed.push({ id: autoNum, num: autoNum, name: item });
        autoNum++;
      }
    });

    return parsed;
  }

  function formatStudentsToText(students) {
    return students.map(s => `${s.num}. ${s.name}`).join('\n');
  }

  // Render the Student Cards Board
  function renderBoard() {
    updateBoardTitle();
    currentTaskNameSpan.textContent = getCurrentTaskName();

    const submittedSet = getSubmittedSet();
    const total = state.students.length;
    let submittedCount = 0;

    // Filter students by search
    const filterQuery = state.filterText.trim().toLowerCase();
    const visibleStudents = state.students.filter(student => {
      if (!filterQuery) return true;
      return (
        student.name.toLowerCase().includes(filterQuery) ||
        String(student.num).includes(filterQuery)
      );
    });

    studentsGrid.innerHTML = '';

    if (state.students.length === 0) {
      studentsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎒</div>
          <p>등록된 학생이 없어요.</p>
          <p style="font-size: 0.85rem; margin-top: 4px;">위의 <strong>'✨ 예시 명단 20명 채우기'</strong>를 누르거나 학생 이름을 입력해보세요!</p>
        </div>
      `;
    } else {
      state.students.forEach(student => {
        if (submittedSet.has(student.id)) {
          submittedCount++;
        }
      });

      visibleStudents.forEach(student => {
        const isSubmitted = submittedSet.has(student.id);

        /*
          Requirement:
          - 학생 이름 칸이 뜨고
          - 학생 이름 칸을 누르면 제출한 것으로 생각하고 연핑크색으로 바뀌고 이름 옆에 하트가 뜨도록 해줘.
          - 아직 안누르는 거는 그냥 하얀색으로 뜨게 하고.
        */
        const card = document.createElement('div');
        card.className = `student-card ${isSubmitted ? 'submitted' : ''}`;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-pressed', isSubmitted ? 'true' : 'false');
        card.setAttribute('data-id', student.id);

        card.innerHTML = `
          <span class="student-num">${student.num}번</span>
          <div class="student-name-wrap">
            <span class="student-name">${escapeHtml(student.name)}</span>
            <span class="student-heart" aria-label="제출 완료">💖</span>
          </div>
          <span class="student-status-text">${isSubmitted ? '제출 완료' : '미제출'}</span>
        `;

        // Click / Space / Enter to toggle
        const toggleHandler = () => {
          toggleStudentSubmission(student.id);
        };

        card.addEventListener('click', toggleHandler);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleHandler();
          }
        });

        studentsGrid.appendChild(card);
      });
    }

    // Update Stats Ribbon
    const unsubmittedCount = total - submittedCount;
    const percentage = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

    submittedCountEl.textContent = submittedCount;
    unsubmittedCountEl.textContent = unsubmittedCount;
    totalCountEl.textContent = total;
    submitPercentEl.textContent = `${percentage}%`;
    progressFillEl.style.width = `${percentage}%`;

    // Status encouragement message
    if (total === 0) {
      statMessageEl.textContent = '학생 명단을 먼저 입력해주세요.';
    } else if (submittedCount === total) {
      statMessageEl.textContent = '전원 제출이 완료되었습니다! 참 잘했어요 💯';
    } else if (percentage >= 80) {
      statMessageEl.textContent = '거의 다 모였습니다. 조금만 더 힘내세요 ✨';
    } else if (percentage >= 50) {
      statMessageEl.textContent = '절반 이상의 학생이 제출을 완료했습니다.';
    } else if (submittedCount > 0) {
      statMessageEl.textContent = '차근차근 확인 중입니다.';
    } else {
      statMessageEl.textContent = '아직 제출한 학생이 없습니다.';
    }

    studentCountBadge.textContent = `현재 등록: 총 ${total}명`;
  }

  // Toggle single student
  function toggleStudentSubmission(studentId) {
    const submittedSet = getSubmittedSet();
    const isNowSubmitted = !submittedSet.has(studentId);

    if (isNowSubmitted) {
      submittedSet.add(studentId);
      playCuteSound('submit');
    } else {
      submittedSet.delete(studentId);
      playCuteSound('unsubmit');
    }

    setSubmittedList(Array.from(submittedSet));
    renderBoard();

    // If 100% completed right now, launch celebration fanfare!
    if (isNowSubmitted && submittedSet.size === state.students.length && state.students.length > 0) {
      playCuteSound('celebrate');
      launchConfetti();
      showToast('🎉 축하합니다! 전원 제출 완료되었습니다!', true);
    }
  }

  // Check All / Uncheck All
  function checkAllStudents() {
    if (state.students.length === 0) return;
    const allIds = state.students.map(s => s.id);
    setSubmittedList(allIds);
    playCuteSound('celebrate');
    launchConfetti();
    renderBoard();
    showToast('💖 모든 학생을 제출 완료 처리했습니다!', true);
  }

  function uncheckAllStudents() {
    if (!confirm(`"${getCurrentTaskName()}"의 모든 제출 상태를 초기화할까요?`)) {
      return;
    }
    setSubmittedList([]);
    playCuteSound('unsubmit');
    renderBoard();
    showToast('🤍 모든 제출 상태를 초기화했습니다.');
  }

  // Copy Unsubmitted List
  function openUnsubmittedModal() {
    const submittedSet = getSubmittedSet();
    const unsubmittedStudents = state.students.filter(s => !submittedSet.has(s.id));

    if (unsubmittedStudents.length === 0) {
      showToast('🎉 현재 미제출 학생이 한 명도 없어요! (모두 제출 완료)', true);
      return;
    }

    const taskName = getCurrentTaskName();
    const namesList = unsubmittedStudents.map(s => `${s.num}번 ${s.name}`).join(', ');
    const textToCopy = `[${state.grade}학년 ${state.classNum}반] ${taskName} 미제출 학생 명단 (총 ${unsubmittedStudents.length}명)\n👉 ${namesList}`;

    unsubmittedTextarea.value = textToCopy;
    unsubmittedModal.classList.add('open');
  }

  function closeUnsubmittedModal() {
    unsubmittedModal.classList.remove('open');
  }

  function copyUnsubmittedText() {
    unsubmittedTextarea.select();
    try {
      navigator.clipboard.writeText(unsubmittedTextarea.value).then(() => {
        showToast('📋 미제출자 명단이 클립보드에 복사되었습니다!', true);
        closeUnsubmittedModal();
      }).catch(() => {
        document.execCommand('copy');
        showToast('📋 복사되었습니다!', true);
        closeUnsubmittedModal();
      });
    } catch (e) {
      document.execCommand('copy');
      showToast('📋 복사되었습니다!', true);
      closeUnsubmittedModal();
    }
  }

  // Helper Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Event Listeners Initialization ---
  function initEvents() {
    // Grade & Class inputs
    gradeInput.value = state.grade;
    classInput.value = state.classNum;

    gradeInput.addEventListener('input', (e) => {
      state.grade = e.target.value.trim() || '3';
      saveState();
      updateBoardTitle();
    });

    classInput.addEventListener('input', (e) => {
      state.classNum = e.target.value.trim() || '2';
      saveState();
      updateBoardTitle();
    });

    // Students Textarea
    studentsTextarea.value = formatStudentsToText(state.students);
    studentsTextarea.addEventListener('input', (e) => {
      state.students = parseStudentsFromText(e.target.value);
      saveState();
      renderBoard();
    });

    // Sample Preset Buttons for Students
    document.getElementById('sample-students-20-btn')?.addEventListener('click', () => {
      state.students = DEFAULT_STUDENTS.slice(0, 20).map((name, idx) => ({ id: idx + 1, num: idx + 1, name }));
      studentsTextarea.value = formatStudentsToText(state.students);
      saveState();
      renderBoard();
      showToast('✨ 20명 예시 명단을 불러왔습니다.', true);
    });

    document.getElementById('sample-students-25-btn')?.addEventListener('click', () => {
      const extraNames = ['문태양', '정하린', '배준우', '한가온', '유서진'];
      const combined = [...DEFAULT_STUDENTS, ...extraNames];
      state.students = combined.map((name, idx) => ({ id: idx + 1, num: idx + 1, name }));
      studentsTextarea.value = formatStudentsToText(state.students);
      saveState();
      renderBoard();
      showToast('✨ 25명 예시 명단을 불러왔습니다.', true);
    });

    document.getElementById('clear-students-btn')?.addEventListener('click', () => {
      if (confirm('학생 명단을 모두 지울까요?')) {
        state.students = [];
        studentsTextarea.value = '';
        saveState();
        renderBoard();
        showToast('학생 명단을 지웠습니다.');
      }
    });

    // Add Check Item
    const handleAddTask = () => {
      if (newTaskInput.value.trim()) {
        addNewTask(newTaskInput.value);
        newTaskInput.value = '';
      }
    };

    addTaskBtn.addEventListener('click', handleAddTask);
    newTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTask();
      }
    });

    // Quick Task Preset Chips
    document.querySelectorAll('.preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemText = btn.getAttribute('data-task');
        if (itemText) {
          addNewTask(itemText);
        }
      });
    });

    // Search input
    searchInput.addEventListener('input', (e) => {
      state.filterText = e.target.value;
      renderBoard();
    });

    // Check all / uncheck all
    checkAllBtn.addEventListener('click', checkAllStudents);
    uncheckAllBtn.addEventListener('click', uncheckAllStudents);

    // Copy Unsubmitted
    copyUnsubmittedBtn.addEventListener('click', openUnsubmittedModal);
    unsubmittedModalClose.addEventListener('click', closeUnsubmittedModal);
    unsubmittedModalCancel.addEventListener('click', closeUnsubmittedModal);
    unsubmittedModalCopyAction.addEventListener('click', copyUnsubmittedText);
    unsubmittedModal.addEventListener('click', (e) => {
      if (e.target === unsubmittedModal) closeUnsubmittedModal();
    });

    // Sound Toggle
    soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      soundToggleBtn.textContent = state.soundEnabled ? '🔊 효과음 ON' : '🔇 효과음 OFF';
      saveState();
      showToast(state.soundEnabled ? '🔊 효과음이 켜졌습니다.' : '🔇 효과음이 꺼졌습니다.');
    });
    soundToggleBtn.textContent = state.soundEnabled ? '🔊 효과음 ON' : '🔇 효과음 OFF';

    // Settings Card Accordion
    const toggleSettings = () => {
      const isHidden = settingsCard.style.display === 'none';
      settingsCard.style.display = isHidden ? 'block' : 'none';
      settingsToggleBtn.textContent = isHidden ? '⚙️ 설정 접기' : '⚙️ 설정 열기';
      if (settingsArrow) {
        settingsArrow.textContent = isHidden ? '▲' : '▼';
      }
    };
    settingsToggleBtn.addEventListener('click', toggleSettings);
    document.getElementById('card-header-toggle')?.addEventListener('click', toggleSettings);

    // Fullscreen toggle
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          fullscreenBtn.textContent = '🪟 화면 복원';
        }).catch(() => {
          showToast('전체화면 전환이 지원되지 않는 환경입니다.');
        });
      } else {
        document.exitFullscreen().then(() => {
          fullscreenBtn.textContent = '🖥️ 전자칠판 모드';
        });
      }
    });

    // Print
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // --- Start App ---
  function init() {
    loadState();
    initEvents();
    renderTasks();
    renderBoard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
