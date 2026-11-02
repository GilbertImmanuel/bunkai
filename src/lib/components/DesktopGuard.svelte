<div class="guard" data-testid="desktop-guard">
  <div class="guard-inner">
    <span class="brand-mark" aria-hidden="true">文</span>
    <h1 class="guard-title">Bunkai is designed for desktop.</h1>
    <p class="guard-text">Resize to at least 900px.</p>
  </div>
</div>

<style>
  .guard {
    display: none;
    width: 100%;
    height: 100dvh;
    align-items: center;
    justify-content: center;
    padding: 32px;
    background-color: var(--bg);
    background-image: var(--bg-gradient);
  }

  .guard-inner {
    display: flex;
    max-width: 380px;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
  }

  .guard-inner .brand-mark {
    width: 34px;
    height: 34px;
    font-size: 19px;
  }

  .guard-title {
    color: var(--ink);
    font-family: var(--font-reading);
    font-size: 26px;
    font-weight: 600;
    line-height: 1.25;
    text-wrap: balance;
  }

  .guard-text {
    color: var(--muted);
    font-family: var(--font-ui);
    font-size: 14px;
    line-height: 1.5;
  }

  @media (max-width: 899px) {
    .guard {
      display: flex;
    }
  }
</style>
