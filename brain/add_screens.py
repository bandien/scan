import codecs

with codecs.open('nhatky/index.html', 'r', 'utf-8') as f:
    content = f.read()

# 1. Update bottom-nav Report link (line 61-64 area)
old_report_nav = '''    <a class="nk-bottomnav__item" href="#" onclick="showToast('Đang phát triển','')">  
      <span class="nk-bottomnav__icon">📊</span>
      <span class="nk-bottomnav__label">Báo cáo</span>
    </a>'''

new_report_nav = '''    <a class="nk-bottomnav__item" href="#" id="navReport" onclick="event.preventDefault(); navigateToReport()">
      <span class="nk-bottomnav__icon">📊</span>
      <span class="nk-bottomnav__label">Báo cáo</span>
    </a>'''

if old_report_nav in content:
    content = content.replace(old_report_nav, new_report_nav)
    print("OK: updated navReport link")
else:
    # Try with actual whitespace variant
    print("WARN: navReport not found, trying fuzzy...")
    import re
    content = re.sub(
        r'<a class="nk-bottomnav__item" href="#" onclick="showToast\(.*?\)">\s*\n\s*<span class="nk-bottomnav__icon">📊</span>\s*\n\s*<span class="nk-bottomnav__label">Báo cáo</span>\s*\n\s*</a>',
        '''    <a class="nk-bottomnav__item" href="#" id="navReport" onclick="event.preventDefault(); navigateToReport()">
      <span class="nk-bottomnav__icon">📊</span>
      <span class="nk-bottomnav__label">Báo cáo</span>
    </a>''',
        content, flags=re.DOTALL
    )
    print("Done fuzzy replace")

# 2. Add screenReport and screenProfile after </div><!-- /screenDetail -->
screen_anchor = '</div><!-- /screenDetail -->'
screens_new = '''\n\n<!-- ═══════════════════════════════════════════════════
     SCREEN: BÁO CÁO
═══════════════════════════════════════════════════ -->
<div class="nk-app" id="screenReport" style="display:none">

  <header class="nk-appbar">
    <div class="nk-appbar__icon">📊</div>
    <div class="nk-appbar__title">
      <div class="nk-appbar__name">Báo cáo</div>
      <div class="nk-appbar__sub" id="reportSub"></div>
    </div>
    <button class="nk-appbar__theme" id="btnThemeReport" title="Đổi giao diện">🌙</button>
  </header>

  <main class="nk-content" id="reportBody">
    <!-- Rendered by JS -->
  </main>

  <nav class="nk-bottomnav" id="bnavReport">
    <a class="nk-bottomnav__item" href="#" onclick="event.preventDefault(); navigateToMain()">
      <span class="nk-bottomnav__icon">🗂</span>
      <span class="nk-bottomnav__label">Công việc</span>
    </a>
    <a class="nk-bottomnav__item" href="../danhba.html">
      <span class="nk-bottomnav__icon">👥</span>
      <span class="nk-bottomnav__label">Danh bạ</span>
    </a>
    <div class="nk-bottomnav__fab">
      <button class="nk-newbtn-fab" onclick="navigateToMain(); setTimeout(openNewTaskModal,200)" aria-label="Thêm việc mới">＋</button>
    </div>
    <a class="nk-bottomnav__item is-active" href="#">
      <span class="nk-bottomnav__icon">📊</span>
      <span class="nk-bottomnav__label">Báo cáo</span>
    </a>
    <a class="nk-bottomnav__item" href="#" onclick="event.preventDefault(); navigateToProfile()">
      <span class="nk-bottomnav__icon">👤</span>
      <span class="nk-bottomnav__label">Cá nhân</span>
    </a>
  </nav>

</div><!-- /screenReport -->


<!-- ═══════════════════════════════════════════════════
     SCREEN: CÁ NHÂN / PROFILE
═══════════════════════════════════════════════════ -->
<div class="nk-app" id="screenProfile" style="display:none">

  <header class="nk-appbar">
    <div class="nk-appbar__icon">👤</div>
    <div class="nk-appbar__title">
      <div class="nk-appbar__name">Cá nhân</div>
    </div>
    <button class="nk-appbar__theme" id="btnThemeProfile" title="Đổi giao diện">🌙</button>
  </header>

  <main class="nk-content" id="profileBody">
    <!-- Rendered by JS -->
  </main>

  <nav class="nk-bottomnav" id="bnavProfile">
    <a class="nk-bottomnav__item" href="#" onclick="event.preventDefault(); navigateToMain()">
      <span class="nk-bottomnav__icon">🗂</span>
      <span class="nk-bottomnav__label">Công việc</span>
    </a>
    <a class="nk-bottomnav__item" href="../danhba.html">
      <span class="nk-bottomnav__icon">👥</span>
      <span class="nk-bottomnav__label">Danh bạ</span>
    </a>
    <div class="nk-bottomnav__fab">
      <button class="nk-newbtn-fab" onclick="navigateToMain(); setTimeout(openNewTaskModal,200)" aria-label="Thêm việc mới">＋</button>
    </div>
    <a class="nk-bottomnav__item" href="#" onclick="event.preventDefault(); navigateToReport()">
      <span class="nk-bottomnav__icon">📊</span>
      <span class="nk-bottomnav__label">Báo cáo</span>
    </a>
    <a class="nk-bottomnav__item is-active" href="#">
      <span class="nk-bottomnav__icon">👤</span>
      <span class="nk-bottomnav__label">Cá nhân</span>
    </a>
  </nav>

</div><!-- /screenProfile -->'''

if screen_anchor in content:
    content = content.replace(screen_anchor, screen_anchor + screens_new)
    print("OK: added screenReport and screenProfile")
else:
    print("ERROR: anchor not found!")

with codecs.open('nhatky/index.html', 'w', 'utf-8') as f:
    f.write(content)

# Verify
with codecs.open('nhatky/index.html', 'r', 'utf-8') as f:
    v = f.read()
print(f"screenReport present: {'screenReport' in v}")
print(f"screenProfile present: {'screenProfile' in v}")
print(f"navReport id present: {'id=\"navReport\"' in v}")
