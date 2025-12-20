const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzDiP9o5huC1vXIoyu-10WISKYsWpwDsOO9TEDJKQXiNSYCELqb87ogjfFzJoY_kDCa/exec"; 

const mainContainer = document.getElementById('main-container');
const loginArea = document.getElementById('login-area');
const dashboardArea = document.getElementById('dashboard-area');
const loginBtn = document.getElementById('login-btn');
const btnSpinner = document.getElementById('btn-spinner');
const btnText = document.getElementById('btn-text');
const messageDiv = document.getElementById('message');

let colaboradorDataGlobal = {};
let escalasBaseData = {};

// CONFIGURAÇÃO
const CYCLE_LENGTH = 8; // 6 dias trabalho + 2 dias folga
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                     "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// FUNÇÃO PARA CARREGAR DADOS DA ESCALA BASE (VERSÃO SIMPLIFICADA)
async function carregarEscalaBase() {
    try {
        console.log('Carregando dados da Escala Base...');
        
        // Buscar dados da API
        const response = await fetch(`${WEB_APP_URL}?tipo=escala_base`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.escalas) {
            // Converter os dados para formato Date
            const escalasConvertidas = {};
            
            for (const [letra, info] of Object.entries(data.escalas)) {
                if (info && info.dataInicio) {
                    // A API retorna a data como ISO string
                    const dataObj = new Date(info.dataInicio);
                    
                    if (!isNaN(dataObj.getTime())) {
                        dataObj.setHours(0, 0, 0, 0); // Ajustar para meia-noite
                        escalasConvertidas[letra] = dataObj;
                    }
                }
            }
            
            if (Object.keys(escalasConvertidas).length > 0) {
                escalasBaseData = escalasConvertidas;
                return true;
            }
        }
        
        throw new Error('Dados inválidos da API');
        
    } catch (error) {
        console.error('Erro ao carregar escala base:', error.message);
        
        // Fallback em caso de erro
        escalasBaseData = {
            'A': new Date(2025, 10, 2, 0, 0, 0),
            'B': new Date(2025, 10, 4, 0, 0, 0),
            'C': new Date(2025, 10, 6, 0, 0, 0),
            'D': new Date(2025, 10, 8, 0, 0, 0)
        };
        
        return false;
    }
}

// FUNÇÃO PARA OBTER DATA DE INÍCIO DA ESCALA
function obterDataInicioEscala(escalaLetra) {
    const letra = escalaLetra.toUpperCase();
    
    if (escalasBaseData[letra]) {
        const data = new Date(escalasBaseData[letra].getTime());
        data.setHours(0, 0, 0, 0);
        return data;
    }
    
    // Valores padrão
    const datasPadrao = {
        'A': new Date(2025, 10, 2, 0, 0, 0),
        'B': new Date(2025, 10, 4, 0, 0, 0),
        'C': new Date(2025, 10, 6, 0, 0, 0),
        'D': new Date(2025, 10, 8, 0, 0, 0)
    };
    
    return datasPadrao[letra] || datasPadrao['A'];
}

// LOGIN
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const matricula = document.getElementById('matricula').value.trim().toUpperCase();
    const nome = document.getElementById('nome').value.trim().toUpperCase();

    loginBtn.disabled = true;
    btnSpinner.style.display = 'block';
    btnText.textContent = 'Autenticando...';
    messageDiv.textContent = '';

    try {
        // Carregar dados da Escala Base
        await carregarEscalaBase();

        // Fazer login do colaborador
        const response = await fetch(`${WEB_APP_URL}?matricula=${encodeURIComponent(matricula)}&nome=${encodeURIComponent(nome)}`);
        const data = await response.json();
        
        if (data.success) {
            colaboradorDataGlobal = data.dados;
            showDashboard();
            messageDiv.style.color = 'green';
            messageDiv.textContent = 'Login realizado com sucesso!';
        } else {
            messageDiv.style.color = 'red';
            messageDiv.textContent = data.message || 'Erro ao acessar. Verifique seus dados.';
        }
    } catch (error) {
        console.error('Erro:', error);
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Erro de conexão. Tente novamente.';
    } finally {
        loginBtn.disabled = false;
        btnSpinner.style.display = 'none';
        btnText.textContent = 'Entrar no Sistema';
    }
});

function showDashboard() {
    loginArea.style.display = 'none';
    dashboardArea.style.display = 'block';
    mainContainer.classList.add('dashboard-mode');
    
    const nomeCurto = colaboradorDataGlobal.nome.split(' ')[0];
    document.getElementById('welcome-message').textContent = `Olá, ${nomeCurto}!`;
    
    // Obter dados do colaborador
    let dataFormatada = colaboradorDataGlobal.dataReferencia || '';
    const escalaLetra = (colaboradorDataGlobal.escalaLetra || "").toUpperCase();
    
    // Se não tiver data formatada, usar data atual
    if (!dataFormatada) {
        const hoje = new Date();
        dataFormatada = hoje.toLocaleDateString('pt-BR');
    }

    // Layout único para desktop e mobile
    document.getElementById('data-area').innerHTML = `
        <div class="dashboard-card">
            <div class="user-profile">
                <div class="user-avatar">
                    <span class="avatar-initial">${nomeCurto.charAt(0)}</span>
                </div>
                <div class="user-info">
                    <h2 class="user-name">${colaboradorDataGlobal.nome}</h2>
                    <p class="user-matricula">Matrícula: <strong>${colaboradorDataGlobal.matricula}</strong></p>
                </div>
            </div>
            
            <div class="dashboard-grid">
                <div class="info-box escala-box">
                    <div class="info-label">Escala</div>
                    <div class="info-value escala-value">Grupo ${escalaLetra}</div>
                </div>
                
                <div class="info-box consulta-box">
                    <div class="consulta-content">
                        <div class="info-label">Data da Consulta</div>
                        <div class="info-value consulta-value">${dataFormatada}</div>
                    </div>
                    <div class="hoje-tag">HOJE</div>
                </div>
                
                <div class="info-box acesso-box">
                    <div class="info-label">Último acesso</div>
                    <div class="info-value acesso-value">
                        ${colaboradorDataGlobal.ultimoAcesso ? colaboradorDataGlobal.ultimoAcesso : 'Primeiro acesso'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    populateMonthSelector();
    updateCalendar();
}

function populateMonthSelector() {
    const select = document.getElementById('month-select');
    select.innerHTML = '';
    const now = new Date();

    // Mostrar os próximos 24 meses (2 anos)
    for (let i = 0; i < 24; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const opt = document.createElement('option');
        opt.value = `${date.getFullYear()}-${date.getMonth().toString().padStart(2, '0')}`;
        opt.textContent = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
        
        if (i === 0) {
            opt.selected = true;
        }
        
        select.appendChild(opt);
    }
} 

function updateCalendar() {
    const select = document.getElementById('month-select');
    if (!select.value) return;

    const [targetYear, targetMonth] = select.value.split('-').map(Number);
    const escalaLetra = (colaboradorDataGlobal.escalaLetra || "A").toUpperCase();
    
    // Obter data de início
    const dataInicio = obterDataInicioEscala(escalaLetra);
    
    // Configurar datas
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    // Função para calcular diferença de dias
    function calcularDiferencaDias(data1, data2) {
        const d1 = new Date(data1.getFullYear(), data1.getMonth(), data1.getDate());
        const d2 = new Date(data2.getFullYear(), data2.getMonth(), data2.getDate());
        const diffMs = d2.getTime() - d1.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    
    // Gerar cabeçalho
    const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let html = weekDays.map(d => `<div class="day-name">${d}</div>`).join('');
    
    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="empty-day"></div>';
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeNum = hoje.getDate();
    const hojeMes = hoje.getMonth();
    const hojeAno = hoje.getFullYear();

    // Gerar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const dateIter = new Date(targetYear, targetMonth, day);
        dateIter.setHours(0, 0, 0, 0);
        
        // Calcular posição no ciclo
        const diffDia = calcularDiferencaDias(dataInicio, dateIter);
        const cyclePos = diffDia % CYCLE_LENGTH;
        const posAjustada = cyclePos < 0 ? cyclePos + CYCLE_LENGTH : cyclePos;
        const isOff = posAjustada >= 6; // 6-7 são folga
        
        let className = `day-cell ${isOff ? 'folga' : 'trabalho'}`;
        
        // Destacar dia atual
        const isHoje = (day === hojeNum && targetMonth === hojeMes && targetYear === hojeAno);
        if (isHoje) {
            className += ' today';
        } 
        else if (dateIter < hoje) {
            className += ' past-day';
        }

        // Status text adaptado para tamanhos de tela
        const statusText = window.innerWidth < 768 ? (isOff ? 'F' : 'T') : (isOff ? 'FOLGA' : 'TRAB');
        
        html += `
            <div class="${className}">
                <div class="day-number">${day}</div>
                <div class="day-status">${statusText}</div>
                ${isHoje ? '<span class="hoje-badge">HOJE</span>' : ''}
            </div>
        `;
    }
    
    document.getElementById('calendar-body').innerHTML = html;
}

function logout() { 
    location.reload();
}

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

// CSS adicional - Layout único para todos os dispositivos
const style = document.createElement('style');
style.textContent = `
    /* Layout do dashboard - Consistente para desktop e mobile */
    .dashboard-card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid #f0f0f0;
    }
    
    .user-profile {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .user-avatar {
        width: 70px;
        height: 70px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .avatar-initial {
        color: white;
        font-size: 28px;
        font-weight: 600;
    }
    
    .user-info {
        flex: 1;
    }
    
    .user-name {
        margin: 0 0 8px 0;
        font-size: 1.4rem;
        color: #333;
        font-weight: 600;
    }
    
    .user-matricula {
        margin: 0;
        font-size: 0.95rem;
        color: #666;
    }
    
    .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
    }
    
    .info-box {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #e9ecef;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .info-box:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
    }
    
    .info-label {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 8px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .info-value {
        font-size: 1.3rem;
        color: #333;
        font-weight: 600;
    }
    
    .escala-box {
        border-left: 4px solid #ffc107;
    }
    
    .escala-value {
        color: #28a745;
    }
    
    .consulta-box {
        background: #fff8e1 !important;
        border: 2px solid #ffc107 !important;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .consulta-content {
        flex: 1;
    }
    
    .consulta-value {
        color: #333;
    }
    
    .hoje-tag {
        background: #ffc107;
        color: #000;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        margin-left: 15px;
    }
    
    .acesso-box {
        border-left: 4px solid #ffc107;
    }
    
    .acesso-value {
        color: #0056b3;
        font-size: 1.1rem;
    }
    
    /* Calendário - Responsivo */
    .calendar-container {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    #calendar-body {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        min-width: 300px;
    }
    
    .day-name {
        font-weight: 600;
        text-align: center;
        padding: 12px 6px;
        background: #f8f9fa;
        border-radius: 6px;
        font-size: 0.9rem;
        color: #555;
    }
    
    .day-cell {
        position: relative;
        padding: 10px 4px;
        min-height: 70px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s ease;
    }
    
    .day-number {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 4px;
    }
    
    .day-status {
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    /* DENTRO DO CALENDÁRIO: TRABALHO = VERDE, FOLGA = VERMELHO */
    .folga {
        background-color: #dc3545 !important;
        color: white !important;
    }
    
    .trabalho {
        background-color: #28a745 !important;
        color: white !important;
    }
    
    /* DIA ATUAL NO CALENDÁRIO: Mantém sua cor original + borda amarela */
    .today {
        border: 3px solid #ffc107 !important;
        box-shadow: 0 0 0 1px #ffc107;
        position: relative;
        z-index: 10;
    }
    
    /* Se o dia atual for trabalho: verde + borda amarela */
    .today.trabalho {
        background-color: #28a745 !important;
        border: 3px solid #ffc107 !important;
        color: white !important;
    }
    
    /* Se o dia atual for folga: vermelho + borda amarela */
    .today.folga {
        background-color: #dc3545 !important;
        border: 3px solid #ffc107 !important;
        color: white !important;
    }
    
    .past-day {
        opacity: 0.7;
    }
    
    .empty-day {
        background-color: white;
    }
    
    /* BADGE HOJE NO CALENDÁRIO: Amarelo */
    .hoje-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #ffc107;
        color: #000;
        font-size: 0.6rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
        z-index: 20;
    }
    
    /* Barras amarelas nos cards (fora do calendário) */
    .escala-box, .acesso-box {
        border-left: 4px solid #ffc107;
    }
    
    /* Layout responsivo */
    @media (min-width: 768px) {
        .dashboard-grid {
            grid-template-columns: repeat(3, 1fr);
        }
        
        .day-cell {
            min-height: 80px;
        }
        
        .day-number {
            font-size: 1.2rem;
        }
        
        .day-status {
            font-size: 0.85rem;
        }
    }
    
    @media (max-width: 767px) {
        .dashboard-card {
            padding: 20px;
            margin: 0 0 20px 0;
        }
        
        .user-profile {
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .user-avatar {
            width: 60px;
            height: 60px;
        }
        
        .avatar-initial {
            font-size: 24px;
        }
        
        .user-name {
            font-size: 1.2rem;
        }
        
        .info-box {
            padding: 16px;
        }
        
        .info-value {
            font-size: 1.1rem;
        }
        
        .hoje-tag {
            padding: 6px 12px;
            font-size: 0.8rem;
        }
        
        .day-cell {
            min-height: 55px;
            padding: 8px 3px;
        }
        
        .day-number {
            font-size: 0.95rem;
        }
        
        .day-status {
            font-size: 0.75rem;
        }
    }
    
    @media (max-width: 480px) {
        .dashboard-card {
            padding: 16px;
        }
        
        .user-profile {
            flex-direction: column;
            text-align: center;
            gap: 12px;
        }
        
        .user-avatar {
            width: 80px;
            height: 80px;
        }
        
        .avatar-initial {
            font-size: 32px;
        }
        
        .user-name {
            font-size: 1.3rem;
        }
        
        .day-cell {
            min-height: 50px;
        }
        
        .day-number {
            font-size: 0.9rem;
        }
    }
    
    /* Controles do calendário */
    .calendar-controls {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }
    
    @media (max-width: 767px) {
        .calendar-controls {
            flex-direction: column;
            gap: 10px;
        }
        
        #month-select, .btn {
            width: 100%;
        }
    }
    
    /* Botões */
    .btn {
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    populateMonthSelector();
    
    // Atualizar calendário quando a janela for redimensionada
    window.addEventListener('resize', function() {
        if (colaboradorDataGlobal.nome) {
            updateCalendar();
        }
    });
});