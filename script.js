const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz31QHV7a13Uwz633o2B662qQRDvMq3vZTbDMlfkdtGE47UmT1qIU09hHcS3ARHER97/exec"; 

const mainContainer = document.getElementById('main-container');
const loginArea = document.getElementById('login-area');
const dashboardArea = document.getElementById('dashboard-area');
const loginBtn = document.getElementById('login-btn');
const btnSpinner = document.getElementById('btn-spinner');
const btnText = document.getElementById('btn-text');
const messageDiv = document.getElementById('message');

let colaboradorDataGlobal = {}; 

// CONFIGURAÇÃO DA ESCALA
const BASE_DATE_A = new Date(2025, 11, 1);
const CYCLE_LENGTH = 8;
const ESCALA_OFFSETS = { 'A': 0, 'B': 5, 'C': 7, 'D': 1 }; 
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// LOGIN
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const matricula = document.getElementById('matricula').value.trim().toUpperCase();
    const nome = document.getElementById('nome').value.trim().toUpperCase();

    loginBtn.disabled = true;
    btnSpinner.style.display = 'block';
    btnText.textContent = 'Autenticando...';

    fetch(`${WEB_APP_URL}?matricula=${encodeURIComponent(matricula)}&nome=${encodeURIComponent(nome)}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                colaboradorDataGlobal = data.dados;
                showDashboard();
            } else {
                messageDiv.style.color = 'red';
                messageDiv.textContent = data.message || 'Erro ao acessar.';
            }
        })
        .catch(() => {
            messageDiv.style.color = 'red';
            messageDiv.textContent = 'Erro de conexão.';
        })
        .finally(() => {
            loginBtn.disabled = false;
            btnSpinner.style.display = 'none';
            btnText.textContent = 'Entrar no Sistema';
        });
});

function showDashboard() {
    loginArea.style.display = 'none';
    dashboardArea.style.display = 'block';
    mainContainer.classList.add('dashboard-mode');
    
    document.getElementById('welcome-message').textContent = `Olá, ${colaboradorDataGlobal.nome}`;
    
    let dataE = colaboradorDataGlobal.turno; 
    if (dataE && dataE.includes('T')) {
        const partes = dataE.split('T')[0].split('-');
        dataE = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    let statusTexto = (colaboradorDataGlobal.status || "").toUpperCase();
    let escalaLetra = (colaboradorDataGlobal.escalaLetra || "").toUpperCase();
    
    if (escalaLetra === "B" && dataE === "18/12/2025") {
        statusTexto = "FOLGA";
    }

    const ehFolga = statusTexto.includes("FOLGA");

    document.getElementById('data-area').innerHTML = `
        <div style="grid-column: span 2; margin-bottom: 10px;"></div>

        <div class="info-item" style="grid-column: span 2; padding-bottom: 10px; margin-bottom: 5px;">
            <span style="color: #757575; font-size: 0.8rem; display: block;">Nome Completo</span>
            <strong style="font-size: 1.1rem; color: #222;">${colaboradorDataGlobal.nome}</strong>
        </div>
        
        <div class="info-item">
            <span style="color: #757575; font-size: 0.8rem; display: block;">Matrícula</span>
            <strong>${colaboradorDataGlobal.matricula}</strong>
        </div>
        
        <div class="info-item">
            <span style="color: #757575; font-size: 0.8rem; display: block;">Escala</span>
            <strong>Grupo ${escalaLetra}</strong>
        </div>
        
        <div class="info-item" style="border-left: 4px solid #333; padding-left: 12px; background: #f9f9f9;">
            <span style="color: #222; font-weight: 700; font-size: 0.85rem; display: block;">Data da Consulta</span>
            <strong style="color: #0056b3; font-size: 1.2rem;">${dataE}</strong>
        </div>
        
        <div class="info-item" style="grid-column: span 2; margin-top: 10px; background: ${ehFolga ? '#fff5f5' : '#f5fff5'}; border: 1px solid ${ehFolga ? '#ffcccb' : '#b7eb8f'}; padding: 12px; border-radius: 8px;">
            <span style="color: #757575; font-size: 0.8rem; display: block;">Status Atualizado</span>
            <strong style="color: ${ehFolga ? '#dc3545' : '#28a745'}; font-size: 1.4rem; display: flex; align-items: center; gap: 8px;">
                ${ehFolga ? '❌ FOLGA' : '✅ TRABALHA'}
            </strong>
        </div>
    `;
    
    populateMonthSelector();
    updateCalendar();
}

function populateMonthSelector() {
    const select = document.getElementById('month-select');
    select.innerHTML = '';
    const now = new Date();
    const targetYearLimit = 2027;
    const targetMonthLimit = 11;

    let currentYear = now.getFullYear();
    let currentMonth = now.getMonth();

    while (currentYear < targetYearLimit || (currentYear === targetYearLimit && currentMonth <= targetMonthLimit)) {
        const opt = document.createElement('option');
        const valMonth = currentMonth.toString().padStart(2, '0');
        opt.value = `${valMonth}${currentYear}`;
        opt.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
        select.appendChild(opt);

        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }
}

function updateCalendar() {
    const select = document.getElementById('month-select');
    if (!select.value) return;

    const val = select.value;
    const targetMonth = parseInt(val.substring(0, 2));
    const targetYear = parseInt(val.substring(2));
    const offset = ESCALA_OFFSETS[colaboradorDataGlobal.escalaLetra.toUpperCase()] || 0;
    
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const diffDays = Math.floor((firstDayOfMonth - BASE_DATE_A) / (1000*60*60*24));
    let startPos = (diffDays + offset) % CYCLE_LENGTH;
    if (startPos < 0) startPos += CYCLE_LENGTH;

    let html = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => `<div class="day-name">${d}</div>`).join('');
    for (let i = 0; i < startingDayOfWeek; i++) html += '<div></div>';

    const today = new Date(); today.setHours(0,0,0,0);

    for (let day = 1; day <= daysInMonth; day++) {
        const dateIter = new Date(targetYear, targetMonth, day);
        const cyclePos = (startPos + day - 1) % CYCLE_LENGTH;
        const isOff = cyclePos >= 6;
        
        let className = `day-cell ${isOff ? 'folga' : 'trabalho'}`;
        if (dateIter < today) className += ' past-day';

        html += `<div class="${className}"><strong>${day}</strong><span class="day-status">${isOff ? 'FOLGA' : 'TRAB'}</span></div>`;
    }
    document.getElementById('calendar-body').innerHTML = html;
}

function logout() { location.reload(); }

function downloadPDF() {
    const btn = document.querySelector('button[onclick="downloadPDF()"]');
    const element = document.getElementById('main-container');
    btn.textContent = "Gerando...";
    btn.disabled = true;

    const opt = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 800,
        windowWidth: 800
    };

    html2canvas(element, opt).then(canvas => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
        pdf.save(`Escala_${colaboradorDataGlobal.nome || 'Colaborador'}.pdf`);
        btn.textContent = "💾 Baixar PDF";
        btn.disabled = false;
    }).catch(err => {
        btn.textContent = "❌ Erro ao baixar";
        btn.disabled = false;
    });
}