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

    // Mostrar informações (LAYOUT SIMPLIFICADO)
    document.getElementById('data-area').innerHTML = `
        <div class="info-item" 
             style="grid-column: span 2; 
                    text-align: center; 
                    padding-bottom: 15px;">
            <span style="color: #757575; 
                         font-size: 0.9rem; 
                         display: block; 
                         margin-bottom: 5px;">
                Colaborador
            </span>
            <strong style="font-size: 1.2rem; 
                          color: #222; 
                          display: block;">
                ${colaboradorDataGlobal.nome}
            </strong>
        </div>
        
        <div class="info-item" 
             style="background: #f8f9fa; 
                    padding: 12px;
                    border-radius: 8px;">
            <span style="color: #666; 
                         font-size: 0.8rem; 
                         display: block;">
                Matrícula
            </span>
            <strong style="color: #0056b3; 
                          font-size: 1rem;">
                ${colaboradorDataGlobal.matricula}
            </strong>
        </div>
        
        <div class="info-item" 
             style="background: #f8f9fa; 
                    padding: 12px;
                    border-radius: 8px;">
            <span style="color: #666; 
                         font-size: 0.8rem; 
                         display: block;">
                Escala
            </span>
            <strong style="color: #28a745; 
                          font-size: 1rem;">
                Grupo ${escalaLetra}
            </strong>
        </div>
        
        <div class="info-item" 
             style="grid-column: span 2; 
                    background: #e8f5e9; 
                    border: 2px solid #4caf50; 
                    padding: 12px; 
                    border-radius: 8px; 
                    margin-top: 10px;">
            <div style="display: flex; 
                        justify-content: space-between; 
                        align-items: center;">
                <div>
                    <span style="color: #2e7d32; 
                                 font-size: 0.8rem; 
                                 display: block;">
                        Data da Consulta
                    </span>
                    <strong style="color: #2e7d32; 
                                   font-size: 1.2rem;">
                        ${dataFormatada}
                    </strong>
                </div>
                <div style="background: #4caf50; 
                            color: white; 
                            padding: 4px 8px; 
                            border-radius: 4px; 
                            font-size: 0.8rem;">
                    HOJE
                </div>
            </div>
        </div>
        
        <div class="info-item" 
             style="grid-column: span 2; 
                    background: #f8f9fa; 
                    padding: 10px; 
                    border-radius: 8px; 
                    margin-top: 5px;">
            <span style="color: #666; 
                         font-size: 0.75rem; 
                         display: block;">
                Último acesso ao sistema
            </span>
            <strong style="color: #0056b3; 
                          font-size: 0.9rem;">
                ${colaboradorDataGlobal.ultimoAcesso ? colaboradorDataGlobal.ultimoAcesso : 'Primeiro acesso'}
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

    for (let i = 0; i < 12; i++) {
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
    let html = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
        .map(d => `<div class="day-name">${d}</div>`)
        .join('');
    
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

        html += `
            <div class="${className}">
                <strong>${day}</strong>
                <span class="day-status">${isOff ? 'FOLGA' : 'TRAB'}</span>
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

// CSS adicional
const style = document.createElement('style');
style.textContent = `
    .today {
        background-color: #2c3e50ff !important;
        border: 2px solid #ffc107 !important;
        font-weight: bold;
    }
    
    .past-day {
        opacity: 0.7;
    }
    
    .empty-day {
        background-color: white;
    }
    
    .hoje-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: #ffc107;
        color: #000;
        font-size: 0.6rem;
        padding: 1px 4px;
        border-radius: 3px;
        font-weight: bold;
    }
    
    .day-cell {
        position: relative;
        padding: 8px 4px;
    }
    
    /* Classes para folga (vermelho) e trabalho (verde) */
    .folga {
        background-color: #dc3545 !important;
        color: white !important;
        border-radius: 4px;
    }
    
    .trabalho {
        background-color: #28a745 !important;
        color: white !important;
        border-radius: 4px;
    }
`;
document.head.appendChild(style);

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    populateMonthSelector();
});