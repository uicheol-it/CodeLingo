/**
 * Bottom Tab Navigation Bar
 */

export function renderBottomNav(container, activeTab, onNavigate) {
  const tabs = [
    { id: 'dashboard', label: '홈' },
    { id: 'learn', label: '기초문법' },
    { id: 'practice', label: '코드연습' },
    { id: 'algorithms', label: '알고리즘' },
    { id: 'guide', label: '심화·사전' },
    { id: 'review', label: '오답노트' },
  ];

  container.innerHTML = `
    <nav class="bottom-nav">
      ${tabs.map(tab => `
        <button class="nav-item ${activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
          <span style="font-size: 0.82rem; font-weight: 700;">${tab.label}</span>
        </button>
      `).join('')}
    </nav>
  `;

  container.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      onNavigate(tabId);
    });
  });
}
