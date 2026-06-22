#!/usr/bin/env python3
"""Chunk extraction when node shell is unavailable — run: python3 scripts/chunk-extract.py"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
APP_BULK = ROOT / "js/features/app-bulk.js"
REFERRAL = ROOT / "js/features/referral-event-modals.js"

APP_BULK_PREFIX = """// Fully extracted from index.html — app bulk features
// Early defensive stub for Social Strategy rich modals (ensures clicks work even if main IIFE is delayed by cache/load)
(function() {
  if (typeof window.openSocialModal !== 'function') {
    window.openSocialModal = function(pillar) {
      const modal = document.getElementById('content-modal');
      const titleEl = document.getElementById('modal-title');
      const listEl = document.getElementById('modal-list');
      if (modal && titleEl && listEl) {
        titleEl.textContent = (pillar || 'Social Strategy') + ' — loading rich content...';
        listEl.innerHTML = `
          <div class="p-6 text-center">
            <p class="mb-4">Loading the refreshed Social Media Strategy content...</p>
            <button onclick="location.reload()" class="px-5 py-2 bg-[#00A89D] text-white rounded-2xl text-sm font-semibold">Force Reload Now</button>
          </div>
        `;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      } else {
        console.warn('[Social] openSocialModal called before full init. Try hard refresh (Ctrl+Shift+R).');
        alert('Social Strategy content is loading. Please hard refresh the page (Ctrl + Shift + R or Cmd + Shift + R) to see the latest rich modals.');
      }
    };
  }
})();

"""

REFERRAL_PREFIX = "// Fully extracted from index.html — referral / event / profile modal helpers\n"


def extract_holder(html: str, holder_id: str):
    open_tag = f'<script type="text/plain" id="{holder_id}"'
    start = html.find(open_tag)
    if start == -1:
        return html, None
    content_start = html.find('>', start) + 1
    close = html.find('</script>', content_start)
    if close == -1:
        raise SystemExit(f'Missing closing tag for #{holder_id}')
    code = html[content_start:close]
    code = code.replace('// PLACEHOLDER_START\n', '', 1)
    new_html = html[:start] + html[close + len('</script>'):]
    return new_html, code.strip() + '\n'


def main():
    before = len(INDEX.read_text(encoding='utf-8').splitlines())
    html = INDEX.read_text(encoding='utf-8')

    html, app_code = extract_holder(html, 'app-bulk-src')
    if app_code:
        APP_BULK.write_text(APP_BULK_PREFIX + app_code, encoding='utf-8')
        print(f'Wrote app-bulk.js ({len(app_code.splitlines())} content lines)')

    html, ref_code = extract_holder(html, 'referral-event-modals-src')
    if ref_code:
        REFERRAL.write_text(REFERRAL_PREFIX + ref_code, encoding='utf-8')
        print(f'Wrote referral-event-modals.js ({len(ref_code.splitlines())} content lines)')

    html = html.replace('</script><!-- referral-event-modals-src end -->', '')
    INDEX.write_text(html, encoding='utf-8')
    after = len(html.splitlines())

    for rel in ('js/features/app-bulk.js', 'js/features/referral-event-modals.js'):
        subprocess.run(['node', '--check', rel], cwd=ROOT, check=True)

    print(f'index.html before: {before} lines')
    print(f'index.html after: {after} lines')
    print('text/plain holders remaining:', html.count('text/plain'))
    print('Syntax check passed.')


if __name__ == '__main__':
    main()