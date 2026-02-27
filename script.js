const transactionForm = document.getElementById('transaction-form');
const transactionsList = document.getElementById('transactions-list');
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

const categoryColors = {
	'Allowance': '#3DBE9F',
	'Food': '#7FD1B9',
	'Transport': '#A6E3D0',
	'Bills': '#9DE5F6',
	'Others': '#B2F7EF'
};
const incomeLineColor = '#3DBE9F';
const expenseLineColor = '#33A78F';

const filterCategory = document.getElementById('filter-category');
const filterFrom = document.getElementById('filter-from');
const filterTo = document.getElementById('filter-to');
const applyFilterBtn = document.getElementById('apply-filter');
const clearFilterBtn = document.getElementById('clear-filter');

function getTodayDate() { return new Date().toISOString().split('T')[0]; }
function updateLocalStorage() { localStorage.setItem('transactions', JSON.stringify(transactions)); }

// --- Render Transactions ---
function renderTransactions(){
	transactionsList.innerHTML = '';
	if(transactions.length === 0){
		const li = document.createElement('li');
		li.style.textAlign='center';
		li.style.color='#aaa';
		li.innerText='No transactions yet. Start adding your income or expenses!';
		transactionsList.appendChild(li);
		return;
	}
	transactions.forEach((t,index)=>{
		const li = document.createElement('li');
		li.className=t.type;
		li.innerHTML=`${t.description} - ₦${t.amount} (${t.category}) 
					  <button onclick="removeTransaction(${index})">x</button>`;
		transactionsList.appendChild(li);
	});
}

// --- Remove Transaction ---
function removeTransaction(index){
	transactions.splice(index,1);
	updateLocalStorage();
	renderTransactions();
	calculateTotals();
	renderChartAnimated(transactions);
	renderLineGraphAnimated(transactions);
}

// --- Calculate Totals & Balance Color ---
function calculateTotals(){
	let income=0, expense=0;
	transactions.forEach(t=> t.type==='income'? income+=t.amount : expense+=t.amount );
	const balance = income - expense;
	document.getElementById('total-income').innerText=income;
	document.getElementById('total-expense').innerText=expense;
	const balanceEl = document.getElementById('balance');
	balanceEl.innerText=balance;
	if(balance>0) balanceEl.style.color='#4caf50';
	else if(balance<0) balanceEl.style.color='#f44336';
	else balanceEl.style.color='#ccc';
}

// --- Add Transaction ---
transactionForm.addEventListener('submit', function(e){
	e.preventDefault();
	const description = document.getElementById('description').value;
	const amount = parseFloat(document.getElementById('amount').value);
	const category = document.getElementById('category').value;
	const type = document.getElementById('type').value;
	const date = getTodayDate();
	const transaction={description,amount,category,type,date};
	transactions.push(transaction);
	updateLocalStorage();
	renderTransactions();
	calculateTotals();
	renderChartAnimated(transactions);
	renderLineGraphAnimated(transactions);
	transactionForm.reset();
});

// --- Filters ---
applyFilterBtn.addEventListener('click', applyFilter);
clearFilterBtn.addEventListener('click', clearFilter);

function applyFilter(){
	let filtered = [...transactions];
	if(filterCategory.value!=='All') filtered = filtered.filter(t=> t.category===filterCategory.value);
	if(filterFrom.value) filtered = filtered.filter(t=> t.date>=filterFrom.value);
	if(filterTo.value) filtered = filtered.filter(t=> t.date<=filterTo.value);
	renderTransactionsFiltered(filtered);
	calculateTotalsFiltered(filtered);
	renderChartAnimated(filtered);
	renderLineGraphAnimated(filtered);
}

function clearFilter(){
	filterCategory.value='All';
	filterFrom.value='';
	filterTo.value='';
	renderTransactions();
	calculateTotals();
	renderChartAnimated(transactions);
	renderLineGraphAnimated(transactions);
}

function renderTransactionsFiltered(list){
	transactionsList.innerHTML='';
	if(list.length===0){
		const li=document.createElement('li');
		li.style.textAlign='center';
		li.style.color='#aaa';
		li.innerText='No transactions match this filter';
		transactionsList.appendChild(li);
		return;
	}
	list.forEach((t,index)=>{
		const li=document.createElement('li');
		li.className=t.type;
		li.innerHTML=`${t.description} - ₦${t.amount} (${t.category}) 
					  <button onclick="removeTransaction(${transactions.indexOf(t)})">x</button>`;
		transactionsList.appendChild(li);
	});
}

function calculateTotalsFiltered(list){
	let income=0, expense=0;
	list.forEach(t=> t.type==='income'? income+=t.amount : expense+=t.amount );
	const balance = income - expense;
	document.getElementById('total-income').innerText=income;
	document.getElementById('total-expense').innerText=expense;
	const balanceEl = document.getElementById('balance');
	balanceEl.innerText=balance;
	if(balance>0) balanceEl.style.color='#4caf50';
	else if(balance<0) balanceEl.style.color='#f44336';
	else balanceEl.style.color='#ccc';
}

// --- Bar Chart Animated Horizontal with Gradient and Tooltip ---
function renderChartAnimated(list){
	const chart=document.getElementById('chart');
	chart.innerHTML='';
	const expenses=list.filter(t=>t.type==='expense');
	if(expenses.length===0){
		const msg=document.createElement('div');
		msg.style.textAlign='center'; msg.style.color='#aaa'; msg.style.width='100%';
		msg.innerText='No expenses to display';
		chart.appendChild(msg); return;
	}
	const totals={};
	expenses.forEach(t=> totals[t.category]=(totals[t.category]||0)+t.amount);

	let tooltip=document.getElementById('bar-tooltip');
	if(!tooltip){
		tooltip=document.createElement('div');
		tooltip.id='bar-tooltip';
		tooltip.style.position='absolute'; tooltip.style.padding='5px 10px';
		tooltip.style.background='#333'; tooltip.style.color='#fff';
		tooltip.style.borderRadius='5px'; tooltip.style.fontSize='12px';
		tooltip.style.pointerEvents='none'; tooltip.style.display='none';
		tooltip.style.zIndex=1000; document.body.appendChild(tooltip);
	}

	const animationSteps=20;
	for(let cat in categoryColors){
		const bar=document.createElement('div'); 
		bar.className='chart-bar'; 
		const color = categoryColors[cat];
		bar.style.background = `linear-gradient(90deg, ${color} 30%, #fff 100%)`;
		bar.innerText = totals[cat]||0; 
		chart.appendChild(bar);

		let currentWidth=0;
		const targetWidth=Math.min((totals[cat]||0)*2, chart.offsetWidth);

		function animate(){ currentWidth+=targetWidth/animationSteps;
			if(currentWidth>targetWidth) currentWidth=targetWidth;
			bar.style.width=currentWidth+'px';
			if(currentWidth<targetWidth) requestAnimationFrame(animate);
		}
		animate();

		bar.addEventListener('mousemove', e=>{
			tooltip.innerHTML=`<strong>${cat}</strong><br>₦${totals[cat]||0}`;
			tooltip.style.left=e.pageX+10+'px';
			tooltip.style.top=e.pageY-30+'px';
			tooltip.style.display='block';
		});
		bar.addEventListener('mouseleave', ()=>{ tooltip.style.display='none'; });
	}
}

// --- Line Chart Animated with Tooltip ---
function renderLineGraphAnimated(list){
	const canvas=document.getElementById('lineChart'); const ctx=canvas.getContext('2d');
	canvas.width=canvas.parentElement.offsetWidth; canvas.height=200;
	ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
	if(list.length===0){ ctx.fillStyle='#aaa'; ctx.font='16px Arial'; ctx.textAlign='center';
		ctx.fillText('No transactions to display',canvas.width/2,canvas.height/2); return;
	}

	const dateMap={}; list.forEach(t=>{ if(!dateMap[t.date]) dateMap[t.date]={income:0,expense:0};
		t.type==='income'? dateMap[t.date].income+=t.amount : dateMap[t.date].expense+=t.amount; });
	const dates=Object.keys(dateMap).sort();
	const incomes=dates.map(d=>dateMap[d].income);
	const expenses=dates.map(d=>dateMap[d].expense);
	const maxAmount=Math.max(...incomes,...expenses,50); const scaleY=canvas.height/maxAmount;
	const pointsIncome=dates.map((d,i)=>({x:(i/(dates.length-1||1))*canvas.width, y:canvas.height-incomes[i]*scaleY}));
	const pointsExpense=dates.map((d,i)=>({x:(i/(dates.length-1||1))*canvas.width, y:canvas.height-expenses[i]*scaleY}));

	// Tooltip
	let tooltip=document.getElementById('line-tooltip');
	if(!tooltip){
		tooltip=document.createElement('div');
		tooltip.id='line-tooltip';
		tooltip.style.position='absolute'; tooltip.style.padding='5px 10px';
		tooltip.style.background='#333'; tooltip.style.color='#fff';
		tooltip.style.borderRadius='5px'; tooltip.style.fontSize='12px';
		tooltip.style.pointerEvents='none'; tooltip.style.display='none';
		tooltip.style.zIndex=1000; document.body.appendChild(tooltip);
	}

	let progress=0; const steps=20;
	function animate(){
		progress++; ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);

		function drawLine(points,color){
			ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath();
			points.forEach((pt,i)=>{ const x=pt.x*progress/steps; const y=canvas.height-((canvas.height-pt.y)*progress/steps);
				i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
			ctx.stroke();
			points.forEach((pt,i)=>{ const x=pt.x*progress/steps; const y=canvas.height-((canvas.height-pt.y)*progress/steps);
				ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,4,0,2*Math.PI); ctx.fill(); 
				ctx.fillStyle='#000'; ctx.font='10px Arial'; ctx.textAlign='center';
				ctx.fillText(dates[i].slice(5),x,canvas.height-2); });
		}
		drawLine(pointsIncome,incomeLineColor); drawLine(pointsExpense,expenseLineColor);

		// Legend
		ctx.fillStyle=incomeLineColor; ctx.fillRect(canvas.width-100,10,10,10); ctx.fillStyle='#000'; ctx.fillText('Income',canvas.width-85,20);
		ctx.fillStyle=expenseLineColor; ctx.fillRect(canvas.width-100,30,10,10); ctx.fillStyle='#000'; ctx.fillText('Expense',canvas.width-85,40);
		if(progress<steps) requestAnimationFrame(animate);
	}
	animate();

	// Hover for tooltip
	canvas.addEventListener('mousemove', function(e){
		const rect=canvas.getBoundingClientRect(); const mouseX=e.clientX-rect.left; const mouseY=e.clientY-rect.top;
		let found=false;
		pointsIncome.forEach((pt,i)=>{ const dx=pt.x-mouseX; const dy=pt.y-mouseY; if(Math.sqrt(dx*dx+dy*dy)<6){
			tooltip.innerHTML=`<strong>${dates[i]}</strong><br>Income: ₦${incomes[i]}`;
			tooltip.style.left=e.pageX+10+'px'; tooltip.style.top=e.pageY-30+'px'; tooltip.style.display='block'; found=true; }});
		pointsExpense.forEach((pt,i)=>{ const dx=pt.x-mouseX; const dy=pt.y-mouseY; if(Math.sqrt(dx*dx+dy*dy)<6){
			tooltip.innerHTML=`<strong>${dates[i]}</strong><br>Expense: ₦${expenses[i]}`;
			tooltip.style.left=e.pageX+10+'px'; tooltip.style.top=e.pageY-30+'px'; tooltip.style.display='block'; found=true; }});
		if(!found) tooltip.style.display='none';
	});
}

// --- Initialize ---
renderTransactions();
calculateTotals();
renderChartAnimated(transactions);
renderLineGraphAnimated(transactions);
