

(function(){

  const displayEl = document.getElementById('display');
  const exprEl = document.getElementById('expr');
  const historyEl = document.getElementById('history');
  const helpBox = document.getElementById('help-box');
  const helpToggle = document.getElementById('help-toggle');


  let expression = '';
  let current = '';
  let history = JSON.parse(localStorage.getItem('calc_history') || '[]');
  let memory = parseFloat(localStorage.getItem('calc_memory') || '0') || 0;
  const MAX_HISTORY = 5;


  function updateUI(){
    displayEl.value = current || (expression ? '' : '0');
    exprEl.textContent = expression;
    renderHistory();
  }


  function renderHistory(){
    historyEl.innerHTML = '';
    history.forEach((h, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${h.expr} = ${h.result}</span>
        <div>
          <button data-idx="${idx}" data-action="use">Use</button>
          <button data-idx="${idx}" data-action="del">Del</button>
        </div>`;
      historyEl.appendChild(li);
    });
  }

  
  function pushHistory(expr, result){
    history.unshift({expr, result, time: new Date().toISOString()});
    if(history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem('calc_history', JSON.stringify(history));
    renderHistory();
  }

 
  function sanitize(s){
    return s.replace(/×/g, '*').replace(/÷/g, '/').replace(/[^0-9.\+\-\*\/\(\)\s]/g, '');
  }


  function detectDivideByZero(s){
    
    return /\/\s*0(?:[^0-9.]|$)/.test(s);
  }

  function safeEval(expr){
    try{
      const sanitized = sanitize(expr);
      if(detectDivideByZero(sanitized)) return { error: 'Division by zero' };
      
      const val = Function('"use strict"; return (' + sanitized + ')')();
      if(val === Infinity || val === -Infinity) return { error: 'Division by zero' };
      if(Number.isNaN(val)) return { error: 'Invalid' };
      return { value: val };
    } catch(e) {
      return { error: 'Invalid' };
    }
  }


  function inputDigit(d){
    if(current === '0') current = d;
    else current = current + d;
    updateUI();
  }

  function inputDot(){
    if(current.includes('.')) return;
    current = current ? current + '.' : '0.';
    updateUI();
  }

  function inputOperator(op){
    if(!current && !expression) return;
    if(!current && /[+\-×÷\s]$/.test(expression)){
      
      expression = expression.slice(0, -1) + op;
    } else {
      expression += (current || '') + op;
      current = '';
    }
    updateUI();
  }

  function clearEntry(){
    current = '';
    updateUI();
  }
  function clearAll(){
    current = '';
    expression = '';
    updateUI();
  }

  function calculate(){
    const expr = expression + (current || '');
    if(!expr) return;
    const res = safeEval(expr);
    if(res.error){
      displayEl.value = res.error;
      expression = '';
      current = '';
    } else {
      const rounded = Math.round((res.value + Number.EPSILON) * 1e12) / 1e12;
      pushHistory(expr, rounded.toString());
      displayEl.value = rounded.toString();
      expression = '';
      current = rounded.toString();
    }
    updateUI();
  }

  
  function memoryPlus(){
    const val = parseFloat(current || displayEl.value || 0) || 0;
    memory = (memory || 0) + val;
    localStorage.setItem('calc_memory', memory);
    flash('M stored');
  }
  function memoryMinus(){
    const val = parseFloat(current || displayEl.value || 0) || 0;
    memory = (memory || 0) - val;
    localStorage.setItem('calc_memory', memory);
    flash('M stored');
  }
  function memoryRecall(){
    current = (memory || 0).toString();
    updateUI();
  }
  function memoryClear(){
    memory = 0;
    localStorage.setItem('calc_memory', memory);
    flash('Memory cleared');
  }

  
  function flash(msg){
    const prev = exprEl.textContent;
    exprEl.textContent = msg;
    setTimeout(() => { exprEl.textContent = prev; }, 900);
  }


  document.querySelectorAll('.num').forEach(b => {
    if (b && b.dataset) b.addEventListener('click', () => inputDigit(b.dataset.val));
  });
  document.querySelectorAll('.op').forEach(b => {
    if (b && b.dataset) b.addEventListener('click', () => inputOperator(b.dataset.val));
  });
  document.querySelectorAll('.dot').forEach(b => {
    if (b) b.addEventListener('click', inputDot);
  });

  const equalsBtn = document.getElementById('equals');
  if(equalsBtn) equalsBtn.addEventListener('click', calculate);

  const ceBtn = document.getElementById('ce');
  if(ceBtn) ceBtn.addEventListener('click', clearEntry);

  const cBtn = document.getElementById('c');
  if(cBtn) cBtn.addEventListener('click', clearAll);

  const mplusBtn = document.getElementById('mplus');
  if(mplusBtn) mplusBtn.addEventListener('click', memoryPlus);

  const mminusBtn = document.getElementById('mminus');
  if(mminusBtn) mminusBtn.addEventListener('click', memoryMinus);

  const mrBtn = document.getElementById('mr');
  if(mrBtn) mrBtn.addEventListener('click', memoryRecall);

  const mcBtn = document.getElementById('mc');
  if(mcBtn) mcBtn.addEventListener('click', memoryClear);

  const clearHistoryBtn = document.getElementById('clear-history');
  if(clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      history = [];
      localStorage.removeItem('calc_history');
      renderHistory();
    });
  }


  if(historyEl) {
    historyEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if(!btn) return;
      const idx = Number(btn.dataset.idx);
      const action = btn.dataset.action;
      if(action === 'use'){
        const item = history[idx];
        if(item) { current = item.result; updateUI(); }
      } else if(action === 'del'){
        history.splice(idx,1);
        localStorage.setItem('calc_history', JSON.stringify(history));
        renderHistory();
      }
    });
  }

 
  if (helpToggle && helpBox) {
    helpToggle.addEventListener('click', () => {
      const visible = helpBox.style.display === 'block';
      helpBox.style.display = visible ? 'none' : 'block';
      helpBox.setAttribute('aria-hidden', visible ? 'true' : 'false');
    });
  }

  
  window.addEventListener('keydown', (e) => {
    if(e.ctrlKey || e.metaKey) return;
    if(/\d/.test(e.key)){
      inputDigit(e.key);
    } else if(['+','-','*','/'].includes(e.key)){
      const map = {'*':'×','/':'÷'};
      inputOperator(map[e.key] || e.key);
    } else if(e.key === '.'){
      inputDot();
    } else if(e.key === 'Enter' || e.key === '='){
      e.preventDefault();
      calculate();
    } else if(e.key === 'Backspace'){
      if(current) current = current.slice(0, -1);
      updateUI();
    } else if(e.key.toLowerCase() === 'c'){
      clearAll();
    }
  });

  
  renderHistory();
  updateUI();

})();
