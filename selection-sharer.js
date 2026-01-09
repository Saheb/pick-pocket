/*
 * Pick Pocket - Selection Popover
 * Shows a simple "Pick" button when text is selected
 */

(function ($) {

  // Create the popover element
  const popoverHtml = `
    <div id="pickpocket-popover" style="
      display: none;
      position: absolute;
      z-index: 999999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      user-select: none;
      transition: transform 0.15s ease, opacity 0.15s ease;
      white-space: nowrap;
    ">
      <span style="margin-right: 4px;">💡</span>Pick
    </div>
  `;

  let $popover = null;
  let hideTimeout = null;

  function init() {
    // Add popover to body
    $('body').append(popoverHtml);
    $popover = $('#pickpocket-popover');

    // Click handler - save the idea
    $popover.on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const selectedText = window.getSelection().toString().trim();
      if (selectedText && selectedText.length > 0) {
        // Call saveIdea from content.js
        if (typeof saveIdea === 'function') {
          const pageUrl = window.location.href;
          saveIdea(selectedText, pageUrl);

          // Visual feedback
          $popover.text('✓ Picked!');
          setTimeout(() => {
            $popover.html('<span style="margin-right: 4px;">💡</span>Pick');
            hidePopover();
          }, 800);
        }
      }
    });

    // Hover effects
    $popover.on('mouseenter', function () {
      $(this).css('transform', 'scale(1.05)');
      clearTimeout(hideTimeout);
    });

    $popover.on('mouseleave', function () {
      $(this).css('transform', 'scale(1)');
    });

    // Listen for text selection
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
  }

  function handleMouseDown(e) {
    // Don't hide if clicking on the popover itself
    if ($popover && !$popover[0].contains(e.target)) {
      hidePopover();
    }
  }

  function handleMouseUp(e) {
    // Don't show if clicking on the popover
    if ($popover && $popover[0].contains(e.target)) {
      return;
    }

    // Small delay to let selection complete
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      // Only show for meaningful selections (at least 3 chars and contains a space or is a word)
      if (selectedText.length >= 3) {
        showPopover(e);
      } else {
        hidePopover();
      }
    }, 10);
  }

  function showPopover(e) {
    if (!$popover) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position above the selection
    const top = window.scrollY + rect.top - 40;
    const left = window.scrollX + rect.left + (rect.width / 2) - 40;

    $popover.css({
      top: Math.max(10, top) + 'px',
      left: Math.max(10, left) + 'px',
      display: 'block',
      opacity: 0,
      transform: 'scale(0.8)'
    });

    // Animate in
    setTimeout(() => {
      $popover.css({
        opacity: 1,
        transform: 'scale(1)'
      });
    }, 10);
  }

  function hidePopover() {
    if ($popover) {
      $popover.css({
        opacity: 0,
        transform: 'scale(0.8)'
      });
      hideTimeout = setTimeout(() => {
        $popover.css('display', 'none');
      }, 150);
    }
  }

  // Initialize when DOM is ready
  $(document).ready(function () {
    init();
  });

})(jQuery);
