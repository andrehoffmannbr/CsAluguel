// Configuração do Supabase
let supabase;

// Funções de mapeamento camelCase ↔ snake_case
function toSnakeCase(obj) {
    const snakeCaseObj = {};
    Object.entries(obj).forEach(([key, value]) => {
        const snakeKey = key
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
        snakeCaseObj[snakeKey] = value;
    });
    return snakeCaseObj;
}

function toCamelCase(obj) {
    const camelCaseObj = {};
    Object.entries(obj).forEach(([key, value]) => {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        camelCaseObj[camelKey] = value;
    });
    return camelCaseObj;
}

// Mapeamento específico para cada tabela
function mapClientToSnakeCase(client) {
    return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        cpf: client.cpf,
        address: client.address,
        party_address: client.partyAddress,
        created_at: client.createdAt,
        updated_at: client.updatedAt
    };
}

function mapClientFromSnakeCase(client) {
    return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        cpf: client.cpf,
        address: client.address,
        partyAddress: client.party_address,
        createdAt: client.created_at,
        updatedAt: client.updated_at
    };
}

function mapInventoryToSnakeCase(item) {
    return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        cost: item.cost,
        rental_price: item.rentalPrice,
        created_at: item.createdAt,
        updated_at: item.updatedAt
    };
}

function mapInventoryFromSnakeCase(item) {
    return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        cost: item.cost,
        rentalPrice: item.rental_price,
        createdAt: item.created_at,
        updatedAt: item.updated_at
    };
}

function mapBookingToSnakeCase(booking) {
    // Verificar se clientId existe e é válido
    if (!booking.clientId && !booking.client_id) {
        console.error('Erro no mapeamento: booking sem clientId/client_id válido', booking);
        throw new Error('ID do cliente não pode ser vazio na conversão para snake_case');
    }
    
    return {
        id: booking.id,
        client_id: booking.client_id || booking.clientId, // Aceita tanto camelCase quanto snake_case
        event_name: booking.eventName,
        date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        items: booking.items,
        price: booking.price,
        payment_method: booking.paymentMethod,
        payment_status: booking.paymentStatus,
        contract_data_url: booking.contractDataUrl,
        event_address: booking.eventAddress,
        observations: booking.observations,
        created_at: booking.createdAt,
        updated_at: booking.updatedAt
    };
}

function mapBookingFromSnakeCase(booking) {
    return {
        id: booking.id,
        clientId: booking.client_id,
        eventName: booking.event_name,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        items: booking.items,
        price: booking.price,
        paymentMethod: booking.payment_method,
        paymentStatus: booking.payment_status,
        contractDataUrl: booking.contract_data_url,
        eventAddress: booking.event_address,
        observations: booking.observations,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
    };
}

// Inicializar Supabase
function initializeSupabase() {
    // Configuração do Supabase - usar apenas variáveis injetadas no HTML
    const SUPABASE_URL = window.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
    
    // Verificar se as variáveis estão disponíveis
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase configuration missing:', {
            url: SUPABASE_URL ? 'OK' : 'MISSING',
            key: SUPABASE_ANON_KEY ? 'OK' : 'MISSING'
        });
        return;
    }
    
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Supabase Service Key: Loaded successfully');
    
    // Verificar se o Supabase está disponível
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully with service role key');
    } else if (typeof createClient !== 'undefined') { // Caso tenha importado via ES Module
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
    } else {
        console.error('Supabase library not loaded');
    }
}

// Funções utilitárias para operações de banco
async function supabaseSelect(table, filters = {}) {
    try {
        let query = supabase.from(table).select('*');
        
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Converter dados do snake_case para camelCase
        const mappedData = (data || []).map(item => {
            switch (table) {
                case 'clients':
                    return mapClientFromSnakeCase(item);
                case 'inventory':
                    return mapInventoryFromSnakeCase(item);
                case 'bookings':
                    return mapBookingFromSnakeCase(item);
                default:
                    return toCamelCase(item);
            }
        });
        
        return mappedData;
    } catch (error) {
        console.error(`Error selecting from ${table}:`, error);
        return [];
    }
}

    async function supabaseUpsert(table, data) {
    try {
        // Verificação adicional para client_id em tabela de bookings
        if (table === 'bookings') {
            const dataToCheck = Array.isArray(data) ? data : [data];
            for (const item of dataToCheck) {
                if (!item.client_id && !item.clientId) {
                    console.error('Tentativa de upsert em bookings com client_id inválido:', item);
                    throw new Error('Erro: client_id não pode ser vazio em bookings');
                }
            }
        }
        
        // Converter dados do camelCase para snake_case
        const mappedData = Array.isArray(data) 
            ? data.map(item => {
                switch (table) {
                    case 'clients':
                        return mapClientToSnakeCase(item);
                    case 'inventory':
                        return mapInventoryToSnakeCase(item);
                    case 'bookings':
                        return mapBookingToSnakeCase(item);
                    default:
                        return toSnakeCase(item);
                }
            })
            : (() => {
                switch (table) {
                    case 'clients':
                        return mapClientToSnakeCase(data);
                    case 'inventory':
                        return mapInventoryToSnakeCase(data);
                    case 'bookings':
                        return mapBookingToSnakeCase(data);
                    default:
                        return toSnakeCase(data);
                }
            })();
            
        // Verificação final após o mapeamento para snake_case
        if (table === 'bookings') {
            const dataToVerify = Array.isArray(mappedData) ? mappedData : [mappedData];
            for (const item of dataToVerify) {
                if (!item.client_id) {
                    console.error('Erro após mapeamento: client_id inválido:', item);
                    throw new Error('Erro: client_id não pode ser vazio após mapeamento em bookings');
                }
            }
        }
        
        const { data: result, error } = await supabase
            .from(table)
            .upsert(mappedData)
            .select();
        
        if (error) throw error;
        
        // Converter resultado de volta para camelCase
        const mappedResult = (result || []).map(item => {
            switch (table) {
                case 'clients':
                    return mapClientFromSnakeCase(item);
                case 'inventory':
                    return mapInventoryFromSnakeCase(item);
                case 'bookings':
                    return mapBookingFromSnakeCase(item);
                default:
                    return toCamelCase(item);
            }
        });
        
        return Array.isArray(data) ? mappedResult : mappedResult[0];
    } catch (error) {
        console.error(`Error upserting to ${table}:`, error);
        throw error;
    }
}

async function supabaseDelete(table, id) {
    try {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Supabase
    initializeSupabase();

    // --- NEW LOGIN ELEMENTS ---
    const loginContainer = document.getElementById('login-container');
    const mainAppContent = document.getElementById('main-app-content');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginErrorMessage = document.getElementById('login-error-message');
    const logoutButton = document.getElementById('logout-btn'); // NEW: Logout button

    // --- ELEMENTOS DO DOM ---
    const totalInventoryDiv = document.getElementById('total-inventory');
    const bookingForm = document.getElementById('booking-form'); 
    const bookingClientSelect = document.getElementById('booking-client'); 
    const eventNameInput = document.getElementById('event-name'); 
    const eventDateInput = document.getElementById('event-date'); 
    const startTimeInput = document.getElementById('start-time'); 
    const endTimeInput = document.getElementById('end-time'); 
    const bookingItemsContainer = document.getElementById('booking-items-container'); 
    const bookingPriceInput = document.getElementById('booking-price'); 
    const paymentMethodInput = document.getElementById('payment-method'); 
    const paymentStatusInput = document.getElementById('payment-status'); 
    const contractFileInput = document.getElementById('contract-file'); 
    const bookingsList = document.getElementById('bookings-list');
    const availabilityInfo = document.getElementById('availability-info'); 
    const tabsContainer = document.getElementById('tabs');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const inventoryListDiv = document.getElementById('inventory-list');
    const addItemForm = document.getElementById('add-item-form');
    const newItemNameInput = document.getElementById('item-name');
    const newItemQuantityInput = document.getElementById('item-quantity');
    const newItemCostInput = document.getElementById('item-cost');
    const newItemRentalPriceInput = document.getElementById('item-rental-price'); 
    const toggleAddItemFormBtn = document.getElementById('toggle-add-item-form-btn');
    const addItemSection = document.getElementById('add-item-section');
    const hamburgerMenu = document.getElementById('hamburger-menu');

    // Booking Tab elements
    const agendaTitle = document.getElementById('agenda-do-dia-title');
    const showBookingFormBtn = document.getElementById('show-booking-form-btn');
    const bookingSection = document.getElementById('booking-section'); 
    const closeBookingFormBtn = document.getElementById('close-booking-form-btn'); 
    const bookingFormDateDisplay = document.getElementById('booking-form-date-display'); 
    const dailyBookingsContainer = document.getElementById('daily-bookings-container');
    const miniCalendarContainer = document.getElementById('mini-calendar-container');
    const prevMonthBookingBtn = document.getElementById('prev-month-booking');
    const nextMonthBookingBtn = document.getElementById('next-month-booking');
    const currentMonthYearBooking = document.getElementById('current-month-year-booking');
    const calendarDaysBookingActual = document.getElementById('calendar-days-booking');

    // Client tab elements
    const addClientForm = document.getElementById('add-client-form');
    const clientsListDiv = document.getElementById('clients-list');
    const clientNameInput = document.getElementById('client-name');
    const clientPhoneInput = document.getElementById('client-phone');
    const clientEmailInput = document.getElementById('client-email');
    const clientCpfInput = document.getElementById('client-cpf');
    const clientStreetInput = document.getElementById('client-street');
    const clientNumberInput = document.getElementById('client-number');
    const clientComplementInput = document.getElementById('client-complement');
    const clientNeighborhoodInput = document.getElementById('client-neighborhood');
    const clientCityInput = document.getElementById('client-city');
    const clientStateInput = document.getElementById('client-state');
    const clientZipInput = document.getElementById('client-zip');
    const clientSearchInput = document.getElementById('client-search-input');

    // Client Party Address elements
    const partyZipInput = document.getElementById('party-zip');
    const partyStreetInput = document.getElementById('party-street');
    const partyNumberInput = document.getElementById('party-number');
    const partyComplementInput = document.getElementById('party-complement');
    const partyNeighborhoodInput = document.getElementById('party-neighborhood');
    const partyCityInput = document.getElementById('party-city');
    const partyStateInput = document.getElementById('party-state');

    // Financial tab elements
    const financialPeriodSelect = document.getElementById('financial-period');
    const financialYearSelect = document.getElementById('financial-year');
    const financialSummaryDiv = document.getElementById('financial-summary');
    const financialDetailsDiv = document.getElementById('financial-details');
    const printFinancialReportBtn = document.getElementById('print-financial-report-btn');
    const updateFinancialReportBtn = document.getElementById('update-financial-report-btn');

    // Modal elements
    const modal = document.getElementById('booking-modal');
    const modalCloseButton = modal.querySelector('.close-button'); // Changed to querySelector
    const modalEventName = document.getElementById('modal-event-name');
    const modalClientName = document.getElementById('modal-client-name');
    const modalEventDate = document.getElementById('modal-event-date');
    const modalEventTime = document.getElementById('modal-event-time');
    const modalEventAddress = document.getElementById('modal-event-address');
    const modalPrice = document.getElementById('modal-price');
    const modalPaymentMethod = document.getElementById('modal-payment-method');
    const modalPaymentStatus = document.getElementById('modal-payment-status');
    const modalItemsList = document.getElementById('modal-items-list');
    const modalContractLink = document.getElementById('modal-contract-link');
    const modalEditBookingBtn = document.getElementById('modal-edit-booking-btn');
    const modalCancelBookingBtn = document.getElementById('modal-cancel-booking-btn');

    // Add Item Confirmation Modal elements
    const confirmAddItemModal = document.getElementById('confirm-add-item-modal');
    const confirmAddItemCloseButton = confirmAddItemModal.querySelector('.close-button'); // Changed to querySelector
    const confirmItemNameSpan = document.getElementById('confirm-item-name');
    const confirmItemQuantitySpan = document.getElementById('confirm-item-quantity');
    const confirmItemCostSpan = document.getElementById('confirm-item-cost');
    const confirmItemRentalPriceSpan = document.getElementById('confirm-item-rental-price'); 
    const confirmAddItemBtn = document.getElementById('confirm-add-item-btn');
    const cancelAddItemBtn = document.getElementById('cancel-add-item-btn');

    // Add Booking Modal elements
    const addBookingModal = document.getElementById('add-booking-modal');
    const addBookingForm = document.getElementById('add-booking-form');
    const addBookingCloseButton = addBookingModal.querySelector('.close-button'); // Changed to querySelector
    const addBookingModalTitle = document.getElementById('add-booking-modal-title');
    const addBookingSubmitBtn = document.getElementById('add-booking-submit-btn');

    const addBookingClientSelect = document.getElementById('add-booking-client');
    const addBookingDateInput = document.getElementById('add-booking-date');
    const addBookingDateDisplay = document.getElementById('add-booking-date-display');
    const addBookingStartTimeInput = document.getElementById('add-booking-start-time');
    const addBookingEndTimeInput = document.getElementById('add-booking-end-time'); 
    const addEventNameInput = document.getElementById('add-event-name');
    const addBookingItemsContainer = document.getElementById('add-booking-items-container');
    const addBookingObservationsInput = document.getElementById('add-booking-observations');
    const modalAvailabilityInfo = document.getElementById('modal-availability-info');
    const addBookingItemsTotalValueSpan = document.getElementById('add-booking-items-total-value');
    const addBookingPriceInput = document.getElementById('add-booking-price'); 
    const addBookingPaymentMethodInput = document.getElementById('add-booking-payment-method'); 
    const addBookingPaymentStatusInput = document.getElementById('add-booking-payment-status'); 

    // Add Booking Address elements - now radio buttons
    const addBookingSameAddressRadio = document.getElementById('add-booking-same-address-radio');
    const addBookingPartyAddressRadio = document.getElementById('add-booking-party-address-radio');
    const addBookingManualAddressRadio = document.getElementById('add-booking-manual-address-radio');
    const addBookingEventAddressSection = document.getElementById('add-booking-event-address-section');
    const addEventZipInput = document.getElementById('add-event-zip');
    const addEventStreetInput = document.getElementById('add-event-street');
    const addEventNumberInput = document.getElementById('add-event-number');
    const addEventComplementInput = document.getElementById('add-event-complement');
    const addEventNeighborhoodInput = document.getElementById('add-event-neighborhood');
    const addEventCityInput = document.getElementById('add-event-city');
    const addEventStateInput = document.getElementById('add-event-state');

    // Generic Alert/Confirm Modal elements
    const customAlertConfirmModal = document.getElementById('custom-alert-confirm-modal');
    const customAlertConfirmTitle = document.getElementById('custom-alert-confirm-title');
    const customAlertConfirmMessage = document.getElementById('custom-alert-confirm-message');
    const customAlertConfirmActions = document.getElementById('custom-alert-confirm-actions');
    const customAlertConfirmCloseBtn = document.getElementById('custom-alert-confirm-close-btn');

    let resolveConfirmPromise; 

    // Estado da aplicação
    let inventory = [];
    let bookings = [];
    let clients = [];
    let clientSearchQuery = ''; 
    
    let miniCalendarDate = new Date();
    let selectedBookingDate = new Date().toISOString().split('T')[0];
    let currentEditingClient = null; 
    let currentEditingBooking = null;

    // Carregar dados iniciais do Supabase
    async function loadInitialData() {
        try {
            if (!supabase) {
                console.error('Supabase not initialized');
                return;
            }

            // Carregar inventário - já mapeado automaticamente pelas funções CRUD
            inventory = await supabaseSelect('inventory');

            // Carregar clientes - já mapeado automaticamente pelas funções CRUD
            clients = await supabaseSelect('clients');

            // Carregar reservas - já mapeado automaticamente pelas funções CRUD
            bookings = await supabaseSelect('bookings');

            // Renderizar interfaces
            renderTotalInventory();
            renderInventoryManagement();
            renderClientsList();
            populateClientsDropdown();
            updateDailyAgenda();
            renderDatePicker(miniCalendarDate);
            renderBookings(); // Adicionado para atualizar a aba 'Reservas Confirmadas'
            initializeFinancialTab();

        } catch (error) {
            console.error('Error loading initial data:', error);
            showAlert('Erro ao carregar dados do sistema. Verifique sua conexão.');
        }
    } 

    // --- NEW LOGIN FUNCTIONS ---
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            loginContainer.style.display = 'none';
            mainAppContent.style.display = 'block';
            document.body.classList.remove('login-active');
        } else {
            loginContainer.style.display = 'flex'; 
            mainAppContent.style.display = 'none';
            document.body.classList.add('login-active');
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (username === 'pedropsf2011@gmail.com' && password === '123456789') {
            localStorage.setItem('isLoggedIn', 'true');
            checkLoginStatus();
            loginErrorMessage.textContent = ''; 
            showAlert('Login bem-sucedido!', 'Bem-vindo(a)!'); 
        } else {
            loginErrorMessage.textContent = 'Usuário ou senha incorretos.';
        }
    }

    // NEW: Logout function
    function handleLogout() {
        localStorage.removeItem('isLoggedIn');
        checkLoginStatus();
        showAlert('Você saiu do sistema.', 'Desconectado');
    }

    // Custom Alert/Confirm Functions
    function showAlert(message, title = 'Atenção!') {
        customAlertConfirmTitle.textContent = title;
        customAlertConfirmMessage.textContent = message;
        customAlertConfirmActions.innerHTML = '<button id="custom-alert-ok-btn" class="confirm-btn">OK</button>';
        customAlertConfirmModal.style.display = 'flex';

        document.getElementById('custom-alert-ok-btn').onclick = () => {
            customAlertConfirmModal.style.display = 'none';
        };
    }

    function showConfirm(message, title = 'Confirmar Ação') {
        return new Promise((resolve) => {
            resolveConfirmPromise = resolve; 

            customAlertConfirmTitle.textContent = title;
            customAlertConfirmMessage.textContent = message;
            customAlertConfirmActions.innerHTML = `
                <button id="custom-confirm-yes-btn" class="confirm-btn"><i class="fas fa-check-circle"></i> Confirmar</button>
                <button id="custom-confirm-no-btn" class="cancel-btn"><i class="fas fa-times-circle"></i> Cancelar</button>
            `;
            customAlertConfirmModal.style.display = 'flex';

            document.getElementById('custom-confirm-yes-btn').onclick = () => {
                customAlertConfirmModal.style.display = 'none';
                resolveConfirmPromise(true);
                resolveConfirmPromise = null; // Corrected: Clear the promise resolver
            };
            document.getElementById('custom-confirm-no-btn').onclick = () => {
                customAlertConfirmModal.style.display = 'none';
                resolveConfirmPromise(false);
                resolveConfirmPromise = null; // Corrected: Clear the promise resolver
            };
        });
    }

    // Event listener for the close button on the custom alert/confirm modal
    if(customAlertConfirmCloseBtn) {
        customAlertConfirmCloseBtn.onclick = () => {
            customAlertConfirmModal.style.display = 'none';
            if (resolveConfirmPromise) {
                resolveConfirmPromise(false); 
                resolveConfirmPromise = null; // Corrected: Clear the promise resolver
            }
        };
    }

    // Funções de utilidade
    function createSlug(name) {
        return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]+!/g, '');
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Funções do date picker (mini-calendário no agendamento)
    function renderDatePicker(date = new Date()) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        currentMonthYearBooking.textContent = date.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        calendarDaysBookingActual.innerHTML = '';
        
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            emptyDay.textContent = '';
            calendarDaysBookingActual.appendChild(emptyDay);
        }
        
        const today = new Date();
        today.setHours(0,0,0,0); 
        const selectedDate = selectedBookingDate;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const dayDate = new Date(year, month, day);
            dayDate.setHours(0,0,0,0); 
            const dayString = dayDate.toISOString().split('T')[0];
            
            if (dayDate.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            if (dayDate.getTime() < today.getTime()) { 
                dayElement.classList.add('past');
            }
            
            if (selectedDate && dayString === selectedDate) {
                dayElement.classList.add('selected');
            }
            
            if (bookings.some(booking => booking.date === dayString)) {
                dayElement.classList.add('has-booking');
            }
            
            dayElement.addEventListener('click', () => {
                if (dayElement.classList.contains('other-month') || dayElement.classList.contains('past')) {
                    return; 
                }
                
                calendarDaysBookingActual.querySelectorAll('.calendar-day').forEach(d => {
                    d.classList.remove('selected');
                });
                
                dayElement.classList.add('selected');
                
                selectedBookingDate = dayString;
                
                updateDailyAgenda();
                updateModalAvailabilityInfo(); 
            });
            
            calendarDaysBookingActual.appendChild(dayElement);
        }
    }

    function navigateMiniCalendar(direction) {
        miniCalendarDate.setMonth(miniCalendarDate.getMonth() + direction);
        renderDatePicker(miniCalendarDate);
    }

    // Funções de lógica de estoque
    function renderTotalInventory() {
        if (!totalInventoryDiv) return;
        totalInventoryDiv.innerHTML = '<p>Estoque Total: </p>';
        const itemsText = inventory.map(item => `<span>${item.name}: ${item.quantity}</span>`).join(', ');
        totalInventoryDiv.querySelector('p').innerHTML += itemsText || 'Nenhum item no estoque.';
    }

    function renderInventoryManagement() {
        inventoryListDiv.innerHTML = '';
        
        const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.cost || 0)), 0);
        const distinctCategories = new Set(inventory.map(item => item.name)).size; 
        const lowStockItems = inventory.filter(item => item.quantity < 5).length;

        document.getElementById('dashboard-total-items').textContent = totalItems;
        document.getElementById('dashboard-total-value').textContent = `R$ ${totalValue.toFixed(2).replace('.', ',')}`;
        document.getElementById('dashboard-distinct-categories').textContent = distinctCategories;
        document.getElementById('dashboard-stock-alert').textContent = lowStockItems;

        if (inventory.length === 0) {
            inventoryListDiv.innerHTML = '<p>Nenhum item no estoque. Adicione um novo item clicando no botão acima.</p>';
            return;
        }

        inventory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item-management';
            itemDiv.innerHTML = `
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <span class="item-id">ID: ${item.id}</span>
                    <span class="item-cost">Custo: R$ ${(item.cost || 0).toFixed(2).replace('.', ',')}</span>
                    <span class="item-rental-price">Aluguel: R$ ${(item.rentalPrice || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="quantity-controls">
                    <label for="qty-${item.id}">Qtd:</label>
                    <input type="number" id="qty-${item.id}" value="${item.quantity}" min="0" data-id="${item.id}">
                </div>
                <div class="cost-controls">
                     <label for="cost-${item.id}">Custo (R$):</label>
                     <input type="number" id="cost-${item.id}" value="${item.cost || 0}" min="0" step="0.01" data-id="${item.id}">
                </div>
                <div class="cost-controls">
                     <label for="rental-price-${item.id}">Aluguel (R$):</label>
                     <input type="number" id="rental-price-${item.id}" value="${item.rentalPrice || 0}" min="0" step="0.01" data-id="${item.id}">
                </div>
                <div class="item-actions">
                    <button class="update-item-btn" data-id="${item.id}">Atualizar</button>
                    <button class="delete-item-btn" data-id="${item.id}">Remover</button>
                </div>
            `;
            inventoryListDiv.appendChild(itemDiv);
        });
    }

    async function handleUpdateItem(e) {
        if (!e.target.classList.contains('update-item-btn')) return;
        const itemId = e.target.dataset.id;
        const newQuantity = parseInt(document.getElementById(`qty-${itemId}`).value, 10);
        const newCost = parseFloat(document.getElementById(`cost-${itemId}`).value);
        const newRentalPrice = parseFloat(document.getElementById(`rental-price-${itemId}`).value); 

        const itemToUpdate = inventory.find(item => item.id === itemId);
        if (itemToUpdate && !isNaN(newQuantity) && newQuantity >= 0 && !isNaN(newCost) && newCost >= 0 && !isNaN(newRentalPrice) && newRentalPrice >= 0) {
            await supabaseUpsert('inventory', { 
                id: itemId,
                name: itemToUpdate.name, 
                quantity: newQuantity, 
                cost: newCost,
                rental_price: newRentalPrice 
            });
            
            // Atualizar estado local
            const itemIndex = inventory.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                inventory[itemIndex] = { ...itemToUpdate, quantity: newQuantity, cost: newCost, rentalPrice: newRentalPrice };
            }
            
            renderTotalInventory();
            renderInventoryManagement();
            showAlert(`Item '${itemToUpdate.name}' atualizado.`);
        } else {
            showAlert('Valores inválidos para quantidade, custo ou valor de aluguel.');
        }
    }
    
    async function handleAddItem(e) {
        e.preventDefault();
        const name = newItemNameInput.value.trim();
        const quantity = parseInt(newItemQuantityInput.value, 10);
        const cost = parseFloat(newItemCostInput.value) || 0;
        const rentalPrice = parseFloat(newItemRentalPriceInput.value) || 0; 

        if (!name || isNaN(quantity) || quantity < 0) {
            showAlert('Por favor, preencha o nome e a quantidade válida.');
            return;
        }
        
        const id = createSlug(name);
        if (inventory.some(item => item.id === id)) {
            showAlert('Um item com este nome já existe.');
            return;
        }

        confirmItemNameSpan.textContent = name;
        confirmItemQuantitySpan.textContent = quantity;
        confirmItemCostSpan.textContent = `R$ ${cost.toFixed(2).replace('.', ',')}`;
        confirmItemRentalPriceSpan.textContent = `R$ ${rentalPrice.toFixed(2).replace('.', ',')}`; 

        confirmAddItemBtn.dataset.name = name;
        confirmAddItemBtn.dataset.quantity = quantity;
        confirmAddItemBtn.dataset.cost = cost;
        confirmAddItemBtn.dataset.rentalPrice = rentalPrice; 
        confirmAddItemBtn.dataset.id = id;

        confirmAddItemModal.style.display = 'flex';
    }

    async function executeAddItem() {
        const { name, quantity, cost, rentalPrice, id } = confirmAddItemBtn.dataset; 

        await supabaseUpsert('inventory', { 
            id, 
            name, 
            quantity: parseInt(quantity, 10), 
            cost: parseFloat(cost),
            rental_price: parseFloat(rentalPrice) 
        });

        // Atualizar estado local
        inventory.push({
            id,
            name,
            quantity: parseInt(quantity, 10),
            cost: parseFloat(cost),
            rentalPrice: parseFloat(rentalPrice)
        });

        addItemForm.reset();
        newItemQuantityInput.value = 1;
        newItemCostInput.value = 0;
        newItemRentalPriceInput.value = 0; 
        
        renderTotalInventory();
        renderInventoryManagement();
        addItemSection.classList.add('hidden'); 
        confirmAddItemModal.style.display = 'none'; 
    }

    async function handleQuickAdd(e) {
        if (!e.target.classList.contains('quick-add-btn')) return;
        
        const name = e.target.dataset.name;
        const quantity = parseInt(e.target.dataset.quantity, 10);
        const cost = parseFloat(e.target.dataset.cost) || 0;
        const rentalPrice = parseFloat(e.target.dataset.rentalPrice) || 0; 
        
        const id = createSlug(name);
        if (inventory.some(item => item.id === id)) {
            showAlert('Um item com este nome já existe.');
            return;
        }

        await supabaseUpsert('inventory', { id, name, quantity, cost, rental_price: rentalPrice }); 
        
        // Atualizar estado local
        inventory.push({ id, name, quantity, cost, rentalPrice });
        renderTotalInventory();
        renderInventoryManagement();
        
        showAlert(`${quantity} ${name}(s) adicionado(s) ao estoque!`);
    }

    async function handleDeleteItem(e) {
        if (!e.target.classList.contains('delete-item-btn')) return;
        
        const itemId = e.target.dataset.id;
        if (await showConfirm('Tem certeza que deseja remover este item do estoque?')) {
            await supabaseDelete('inventory', itemId);
            
            // Atualizar estado local
            const itemIndex = inventory.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                const itemName = inventory[itemIndex].name;
                inventory.splice(itemIndex, 1);
                renderTotalInventory();
                renderInventoryManagement();
                showAlert(`Item '${itemName}' removido do estoque.`);
            }
        }
    }

    // Funções de lógica de clientes
    function formatCEPInput(input) {
        let value = input.value.replace(/\D/g, ''); 
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        input.value = value;
    }

    async function handleUpsertClient(e) { 
        e.preventDefault();
        const name = clientNameInput.value.trim();
        if (!name) {
            showAlert('O nome do cliente é obrigatório.');
            return;
        }

        const clientData = {
            name: name,
            phone: clientPhoneInput.value.trim(),
            email: clientEmailInput.value.trim(),
            cpf: clientCpfInput.value.trim(),
            address: {
                street: clientStreetInput.value.trim(),
                number: clientNumberInput.value.trim(),
                complement: clientComplementInput.value.trim(),
                neighborhood: clientNeighborhoodInput.value.trim(),
                city: clientCityInput.value.trim(),
                state: clientStateInput.value.trim(),
                zip: clientZipInput.value.trim(),
            },
            party_address: {
                street: partyStreetInput.value.trim(),
                number: partyNumberInput.value.trim(),
                complement: partyComplementInput.value.trim(),
                neighborhood: partyNeighborhoodInput.value.trim(),
                city: partyCityInput.value.trim(),
                state: partyStateInput.value.trim(),
                zip: partyZipInput.value.trim(),
            }
        };

        if (currentEditingClient) {
            await supabaseUpsert('clients', { 
                ...clientData, 
                id: currentEditingClient.id,
                
            });
            
            // Atualizar estado local
            const clientIndex = clients.findIndex(c => c.id === currentEditingClient.id);
            if (clientIndex !== -1) {
                clients[clientIndex] = { ...clientData, id: currentEditingClient.id };
            }
            
            renderClientsList();
            populateClientsDropdown();
            showAlert('Cliente atualizado com sucesso!');
            currentEditingClient = null;
            const submitBtn = addClientForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Cadastrar Cliente';
            submitBtn.classList.remove('update-mode');
        } else {
            const newClientId = String(Date.now());
            await supabaseUpsert('clients', { 
                ...clientData, 
                id: newClientId,
             
            });
            
            // Atualizar estado local
            clients.push({ ...clientData, id: newClientId });
            renderClientsList();
            populateClientsDropdown();
            showAlert('Cliente cadastrado com sucesso!');
        }

        addClientForm.reset();
    }

    function renderClientsList() {
        clientsListDiv.innerHTML = '';
        
        const filteredClients = clients.filter(client => {
            const query = clientSearchQuery.toLowerCase();
            return (client.name && client.name.toLowerCase().includes(query)) ||
                   (client.cpf && client.cpf.toLowerCase().includes(query));
        });

        if (filteredClients.length === 0) {
            clientsListDiv.innerHTML = '<p>Nenhum cliente cadastrado ou encontrado com o termo de pesquisa.</p>';
            return;
        }

        filteredClients.forEach(client => { 
            const clientCard = document.createElement('div');
            clientCard.className = 'client-card';
            const addressString = [
                client.address.street,
                client.address.number,
                client.address.complement,
                client.address.neighborhood,
                client.address.city,
                client.address.state,
                client.address.zip
            ].filter(Boolean).join(', ');

            const partyAddressString = client.partyAddress && [
                client.partyAddress.street,
                client.partyAddress.number,
                client.partyAddress.complement,
                client.partyAddress.neighborhood,
                client.partyAddress.city,
                client.partyAddress.state,
                client.partyAddress.zip
            ].filter(Boolean).join(', ');

            clientCard.innerHTML = `
                <h3>${client.name}</h3>
                ${client.phone ? `<p><strong><i class="fas fa-phone"></i> Telefone:</strong> ${client.phone}</p>` : ''}
                ${client.email ? `<p><strong><i class="fas fa-envelope"></i> Email:</strong> ${client.email}</p>` : ''}
                ${client.cpf ? `<p><strong><i class="fas fa-id-badge"></i> CPF/CNPJ:</strong> ${client.cpf}</p>` : ''}
                ${addressString ? `<p><strong><i class="fas fa-map-marker-alt"></i> Endereço Cliente:</strong> ${addressString}</p>` : ''}
                ${partyAddressString ? `<p><strong><i class="fas fa-glass-cheers"></i> Endereço Festa:</strong> ${partyAddressString}</p>` : ''}
                <div class="client-actions">
                     <button class="edit-client-btn" data-id="${client.id}">Editar</button>
                     <button class="delete-client-btn" data-id="${client.id}">Excluir</button>
                </div>
            `;
            clientsListDiv.appendChild(clientCard);
        });
    }

    function handleEditClient(e) {
        if (!e.target.classList.contains('edit-client-btn')) return;

        const clientId = e.target.dataset.id; 
        const clientToEdit = clients.find(c => c.id == clientId); 

        if (clientToEdit) {
            currentEditingClient = clientToEdit;

            clientNameInput.value = clientToEdit.name || '';
            clientPhoneInput.value = clientToEdit.phone || '';
            clientEmailInput.value = clientToEdit.email || '';
            clientCpfInput.value = clientToEdit.cpf || '';

            if (clientToEdit.address) {
                clientZipInput.value = clientToEdit.address.zip || '';
                clientStreetInput.value = clientToEdit.address.street || '';
                clientNumberInput.value = clientToEdit.address.number || '';
                clientComplementInput.value = clientToEdit.address.complement || '';
                clientNeighborhoodInput.value = clientToEdit.address.neighborhood || '';
                clientCityInput.value = clientToEdit.address.city || '';
                clientStateInput.value = clientToEdit.address.state || '';
            } else {
                clientZipInput.value = ''; clientStreetInput.value = ''; clientNumberInput.value = '';
                clientComplementInput.value = ''; clientNeighborhoodInput.value = ''; clientCityInput.value = '';
                clientStateInput.value = '';
            }

            if (clientToEdit.partyAddress) {
                partyZipInput.value = clientToEdit.partyAddress.zip || '';
                partyStreetInput.value = clientToEdit.partyAddress.street || '';
                partyNumberInput.value = clientToEdit.partyAddress.number || '';
                partyComplementInput.value = clientToEdit.partyAddress.complement || '';
                partyNeighborhoodInput.value = clientToEdit.partyAddress.neighborhood || '';
                partyCityInput.value = clientToEdit.partyAddress.city || '';
                partyStateInput.value = clientToEdit.partyAddress.state || '';
            } else {
                partyZipInput.value = ''; partyStreetInput.value = ''; partyNumberInput.value = '';
                partyComplementInput.value = ''; partyNeighborhoodInput.value = ''; partyCityInput.value = '';
                partyStateInput.value = '';
            }

            const submitBtn = addClientForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Atualizar Cliente';
            submitBtn.classList.add('update-mode'); 

            document.querySelector('.tab-btn[data-tab="register-client-tab"]').click();
            clientNameInput.focus(); 
        }
    }
    
    async function handleDeleteClient(e) {
        if (!e.target.classList.contains('delete-client-btn')) return;

        const clientId = e.target.dataset.id; 
        if (await showConfirm('Tem certeza que deseja excluir este cliente? Isso NÃO excluirá as reservas associadas.')) {
            await supabaseDelete('clients', clientId);
            
            // Atualizar estado local
            const clientIndex = clients.findIndex(c => c.id === clientId);
            if (clientIndex !== -1) {
                const clientName = clients[clientIndex].name;
                clients.splice(clientIndex, 1);
                renderClientsList();
                populateClientsDropdown();
                showAlert(`Cliente '${clientName}' excluído com sucesso.`);
            }
        }
    }
    
    function populateClientsDropdown() {
        addBookingClientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            addBookingClientSelect.appendChild(option);
        });
        addBookingClientSelect.value = '';

        bookingClientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            bookingClientSelect.appendChild(option);
        });
        bookingClientSelect.value = '';
    }

    // Funções de navegação por abas
    function handleTabClick(e) {
        if (!e.target.classList.contains('tab-btn')) return;
        
        const targetTab = e.target.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        
        closeMobileMenu();
        
        if (targetTab === 'booking-tab') {
            updateDailyAgenda();
            renderDatePicker(miniCalendarDate);
            renderModalBookingFormItems();
            updateModalItemsTotalValue();
        } else if (targetTab === 'register-client-tab') {
            if (!currentEditingClient) {
                addClientForm.reset();
                const submitBtn = addClientForm.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Cadastrar Cliente';
                submitBtn.classList.remove('update-mode');
            }
        } else if (targetTab === 'clients-tab') {
            clientSearchInput.value = '';
            clientSearchQuery = '';
            renderClientsList(); 
        }
    }

    // Funções do menu hamburger
    function toggleMobileMenu() {
        const tabsNav = document.getElementById('tabs');
        const overlay = document.querySelector('.menu-overlay') || createMenuOverlay();
        
        hamburgerMenu.classList.toggle('active');
        tabsNav.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    function closeMobileMenu() {
        const tabsNav = document.getElementById('tabs');
        const overlay = document.querySelector('.menu-overlay');
        
        hamburgerMenu.classList.remove('active');
        tabsNav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }

    function createMenuOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.addEventListener('click', closeMobileMenu);
        document.body.appendChild(overlay);
        return overlay;
    }

    // Funções financeiras
    function calculateBookingCost(booking) {
        let cost = 0;
        for (const itemId in booking.items) {
            const item = inventory.find(i => i.id === itemId);
            if (item) {
                const quantity = booking.items[itemId];
                cost += (item.cost || 0) * quantity;
            }
        }
        return cost;
    }

    function calculateBookingRentalRevenue(booking) {
        let rentalRevenue = 0;
        for (const itemId in booking.items) {
            const item = inventory.find(i => i.id === itemId);
            if (item) {
                const quantity = booking.items[itemId];
                rentalRevenue += (item.rentalPrice || 0) * quantity;
            }
        }
        return rentalRevenue;
    }

    function initializeFinancialTab() {
        financialYearSelect.innerHTML = '';
        for (let i = new Date().getFullYear() - 5; i <= new Date().getFullYear() + 2; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === new Date().getFullYear()) option.selected = true;
            financialYearSelect.appendChild(option);
        }
        
        financialPeriodSelect.value = 'monthly';

        renderFinancialReport();
    }

    function renderFinancialReport() {
        const period = financialPeriodSelect.value;
        const year = parseInt(financialYearSelect.value);

        const filteredBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate.getFullYear() === year && (booking.price || 0) > 0;
        });

        renderFinancialSummary(filteredBookings, period, year);
        renderFinancialDetails(filteredBookings, period, year);
    }

    function renderFinancialSummary(bookingsData, period, year) {
        const totalRevenue = bookingsData.reduce((sum, booking) => sum + (booking.price || 0), 0);
        const totalBookingsCount = bookingsData.length;

        const costOfMaterialsUsed = bookingsData.reduce((sum, booking) => sum + calculateBookingCost(booking), 0);

        const estimatedRentalRevenue = bookingsData.reduce((sum, booking) => sum + calculateBookingRentalRevenue(booking), 0);

        const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.cost || 0)), 0);

        const netResult = totalRevenue - costOfMaterialsUsed;

        const activeClients = clients.length;

        financialSummaryDiv.innerHTML = `
            <div class="financial-card-new card-revenue">
                <div class="card-icon"><i class="fas fa-chart-line"></i></div>
                <div class="card-content">
                    <span class="card-title">RECEITA TOTAL (NEGOCIADA)</span>
                    <span class="card-value">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</span>
                    <span class="card-subtitle">Atendimentos: ${totalBookingsCount}</span>
                </div>
            </div>
            <div class="financial-card-new card-rental-revenue">
                <div class="card-icon"><i class="fas fa-coins"></i></div>
                <div class="card-content">
                    <span class="card-title">RECEITA ESTIMADA DOS ITENS</span>
                    <span class="card-value">R$ ${estimatedRentalRevenue.toFixed(2).replace('.', ',')}</span>
                    <span class="card-subtitle">Valor padrão dos itens alugados</span>
                </div>
            </div>
            <div class="financial-card-new card-expenses">
                <div class="card-icon"><i class="fas fa-shopping-cart"></i></div>
                <div class="card-content">
                    <span class="card-title">VALOR TOTAL DO ESTOQUE</span>
                    <span class="card-value">R$ ${totalInventoryValue.toFixed(2).replace('.', ',')}</span>
                    <span class="card-subtitle">Materiais adquiridos</span>
                </div>
            </div>
            <div class="financial-card-new card-costs">
                <div class="card-icon"><i class="fas fa-wrench"></i></div>
                <div class="card-content">
                    <span class="card-title">CUSTO DE MATERIAIS USADOS</span>
                    <span class="card-value">R$ ${costOfMaterialsUsed.toFixed(2).replace('.', ',')}</span>
                    <span class="card-subtitle">Materiais em atendimentos</span>
                </div>
            </div>
            <div class="financial-card-new card-net">
                <div class="card-icon"><i class="fas fa-balance-scale"></i></div>
                <div class="card-content">
                    <span class="card-title">RESULTADO LÍQUIDO</span>
                    <span class="card-value ${netResult < 0 ? 'negative' : ''}">R$ ${netResult.toFixed(2).replace('.', ',')}</span>
                    <span class="card-subtitle">Receitas - Custos do Período</span>
                </div>
            </div>
            <div class="financial-card-new card-clients">
                <div class="card-icon"><i class="fas fa-users"></i></div>
                <div class="card-content">
                    <span class="card-title">CLIENTES ATIVOS</span>
                    <span class="card-value">${activeClients}</span>
                    <span class="card-subtitle">Total cadastrados</span>
                </div>
            </div>
            <div class="financial-card-new card-appointments">
                <div class="card-icon"><i class="fas fa-calendar-check"></i></div>
                <div class="card-content">
                    <span class="card-title">AGENDAMENTOS</span>
                    <span class="card-value">${totalBookingsCount}</span>
                    <span class="card-subtitle">No período</span>
                </div>
            </div>
        `;
    }

    function renderFinancialDetails(bookingsData, period, year) {
        let groupedData = {};
        
        bookingsData.forEach(booking => {
            const date = new Date(booking.date);
            let key;
            
            if (period === 'monthly') {
                key = `${date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
            } else if (period === 'quarterly') {
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                key = `${quarter}º Trimestre ${date.getFullYear()}`;
            } else {
                key = `${date.getFullYear()}`;
            }
            
            if (!groupedData[key]) {
                groupedData[key] = { bookings: [], total: 0, paid: 0, pending: 0, partial: 0, estimatedRental: 0 }; 
            }
            
            groupedData[key].bookings.push(booking);
            groupedData[key].total += booking.price || 0;
            groupedData[key].estimatedRental += calculateBookingRentalRevenue(booking); 

            if (booking.paymentStatus === 'Pago') {
                groupedData[key].paid += booking.price || 0;
            } else if (booking.paymentStatus === 'Pendente') {
                groupedData[key].pending += booking.price || 0;
            } else if (booking.paymentStatus === 'Parcial') {
                groupedData[key].partial += booking.price || 0;
            }
        });
        
        let detailsHTML = `<h3>Detalhes por ${period === 'monthly' ? 'Mês' : period === 'quarterly' ? 'Trimestre' : 'Ano'}</h3>`;
        
        if (Object.keys(groupedData).length === 0) {
            detailsHTML += '<p>Nenhuma reserva encontrada para o período selecionado.</p>';
        } else {
            detailsHTML += `
                <table class="financial-table">
                    <thead>
                        <tr>
                            <th>Período</th>
                            <th>Reservas</th>
                            <th>Total Negociado</th>
                            <th>Valor Estimado (Itens)</th>
                            <th>Pago</th>
                            <th>Pendente</th>
                            <th>Parcial</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            Object.entries(groupedData).forEach(([period, data]) => {
                detailsHTML += `
                    <tr>
                        <td>${period}</td>
                        <td>${data.bookings.length}</td>
                        <td>R$ ${data.total.toFixed(2).replace('.', ',')}</td>
                        <td>R$ ${data.estimatedRental.toFixed(2).replace('.', ',')}</td>
                        <td class="status-pago-financial">R$ ${data.paid.toFixed(2).replace('.', ',')}</td>
                        <td class="status-pendente-financial">R$ ${data.pending.toFixed(2).replace('.', ',')}</td>
                        <td class="status-parcial-financial">R$ ${data.partial.toFixed(2).replace('.', ',')}</td>
                    </tr>
                `;
            });
            
            detailsHTML += '</tbody></table>';
        }
        
        financialDetailsDiv.innerHTML = detailsHTML;
    }

    async function printFinancialReport() {
        const period = financialPeriodSelect.value;
        const year = parseInt(financialYearSelect.value);

        const filteredBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate.getFullYear() === year && (booking.price || 0) > 0;
        });

        const reportContent = generatePrintableFinancialReportHTML(filteredBookings, period, year);

        let styleContent = '';
        try {
            const response = await fetch('style.css');
            styleContent = await response.text();
        } catch (error) {
            console.error('Error fetching style.css for printing:', error);
            showAlert('Não foi possível carregar os estilos para impressão. O relatório pode não aparecer corretamente.');
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório Financeiro CS Aluguel de Mesa e Pula Pula</title>
                <style>
                    ${styleContent}
                </style>
            </head>
            <body>
                ${reportContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    function generatePrintableFinancialReportHTML(filteredBookings, period, year) {
        let html = '';

        const totalRevenue = filteredBookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
        const costOfMaterialsUsed = filteredBookings.reduce((sum, booking) => sum + calculateBookingCost(booking), 0);
        const estimatedRentalRevenue = filteredBookings.reduce((sum, booking) => sum + calculateBookingRentalRevenue(booking), 0); 
        const netResult = totalRevenue - costOfMaterialsUsed;
        const totalBookingsCount = filteredBookings.length;

        html += `
            <h2>Resumo Financeiro</h2>
            <div class="print-summary financial-summary-grid">
                <div class="financial-card-new card-revenue">
                    <div class="card-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="card-content">
                        <span class="card-title">RECEITA TOTAL (NEGOCIADA)</span>
                        <span class="card-value">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</span>
                        <span class="card-subtitle">Atendimentos: ${totalBookingsCount}</span>
                    </div>
                </div>
                <div class="financial-card-new card-rental-revenue">
                    <div class="card-icon"><i class="fas fa-coins"></i></div>
                    <div class="card-content">
                        <span class="card-title">RECEITA ESTIMADA DOS ITENS</span>
                        <span class="card-value">R$ ${estimatedRentalRevenue.toFixed(2).replace('.', ',')}</span>
                        <span class="card-subtitle">Valor padrão dos itens alugados</span>
                    </div>
                </div>
                <div class="financial-card-new card-costs">
                    <div class="card-icon"><i class="fas fa-wrench"></i></div>
                    <div class="card-content">
                        <span class="card-title">CUSTO DE MATERIAIS USADOS</span>
                        <span class="card-value">R$ ${costOfMaterialsUsed.toFixed(2).replace('.', ',')}</span>
                        <span class="card-subtitle">Materiais em atendimentos</span>
                    </div>
                </div>
                <div class="financial-card-new card-net">
                    <div class="card-icon"><i class="fas fa-balance-scale"></i></div>
                    <div class="card-content">
                        <span class="card-title">RESULTADO LÍQUIDO</span>
                        <span class="card-value ${netResult < 0 ? 'negative' : ''}">R$ ${netResult.toFixed(2).replace('.', ',')}</span>
                        <span class="card-subtitle">Receitas - Custos do Período</span>
                    </div>
                </div>
                <div class="financial-card-new card-appointments">
                    <div class="card-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="card-content">
                        <span class="card-title">AGENDAMENTOS</span>
                        <span class="card-value">${totalBookingsCount}</span>
                        <span class="card-subtitle">No período</span>
                    </div>
                </div>
            </div>
        `;

        if (filteredBookings.length === 0) {
            html += '<p>Nenhuma reserva encontrada para o período selecionado.</p>';
        } else {
            let groupedBookings = {};
            filteredBookings.forEach(booking => {
                const date = new Date(booking.date);
                let key;
                if (period === 'monthly') {
                    key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                } else if (period === 'quarterly') {
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    key = `${date.getFullYear()}-Q${quarter}`;
                } else {
                    key = `${date.getFullYear()}`;
                }
                if (!groupedBookings[key]) {
                    groupedBookings[key] = [];
                }
                groupedBookings[key].push(booking);
            });

            const sortedKeys = Object.keys(groupedBookings).sort();

            sortedKeys.forEach(key => {
                const periodName = formatPeriodKey(key, period);
                html += `<h3>${periodName}</h3>`;
                html += `
                    <table class="financial-table print-details-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Evento</th>
                                <th>Cliente</th>
                                <th>Itens</th>
                                <th>Valor Total (Negociado)</th>
                                <th>Valor Estimado (Itens)</th>
                                <th>Pagamento</th>
                                <th>Status</th>
                                <th>Contrato/Nota</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                const sortedPeriodBookings = groupedBookings[key].sort((a, b) => {
                    const dateComparison = new Date(a.date) - new Date(b.date);
                    if (dateComparison !== 0) return dateComparison;
                    const timeA = a.startTime || '00:00';
                    const timeB = b.startTime || '00:00';
                    return timeA.localeCompare(timeB);
                });

                sortedPeriodBookings.forEach(booking => {
                    const client = clients.find(c => c.id == booking.client_id); 
                    const itemsBooked = Object.entries(booking.items)
                        .filter(([, quantity]) => quantity > 0)
                        .map(([itemId, quantity]) => {
                            const item = inventory.find(i => i.id === itemId);
                            return `${item ? item.name : itemId}: ${quantity}`;
                        })
                        .join('<br>');

                    const contractLink = booking.contractDataUrl
                        ? `<a href="${booking.contractDataUrl}" target="_blank" rel="noopener noreferrer" class="contract-link" onclick="event.stopPropagation()">Ver Contrato</a>`
                        : 'Sem Anexo';

                    const timeRange = (booking.startTime && booking.endTime) ? `${booking.startTime} - ${booking.endTime}` : 'Não especificado';

                    html += `
                        <tr>
                            <td>${new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td>${timeRange}</td>
                            <td>${booking.eventName}</td>
                            <td>${client ? client.name : 'N/A'}</td>
                            <td>${itemsBooked || 'Nenhum item'}</td>
                            <td>R$ ${booking.price ? booking.price.toFixed(2).replace('.', ',') : '0,00'}</td>
                            <td>R$ ${calculateBookingRentalRevenue(booking).toFixed(2).replace('.', ',')}</td>
                            <td>${booking.paymentMethod || 'N/A'}</td>
                            <td><span class="payment-status status-${booking.paymentStatus.toLowerCase()}">${booking.paymentStatus}</span></td>
                            <td>${contractLink}</td>
                        </tr>
                    `;
                });

                html += `
                        </tbody>
                    </table>
                `;
            });
        }
        return html;
    }

    function formatPeriodKey(key, period) {
        if (period === 'monthly') {
            const [year, month] = key.split('-');
            const date = new Date(year, parseInt(month) - 1, 1);
            return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        } else if (period === 'quarterly') {
            const [year, quarter] = key.split('-');
            return `${quarter.replace('Q', '')}º Trimestre ${year}`;
        } else {
            return key; 
        }
    }

    // Funções de lógica de reservas
    function updateDailyAgenda() {
        if(!agendaTitle) return;

        const dateObj = new Date(selectedBookingDate + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        agendaTitle.textContent = `Agenda do Dia - ${formattedDate}`;

        const bookingsOnDate = bookings
            .filter(b => b.date === selectedBookingDate)
            .sort((a, b) => {
                const timeA = a.startTime || '00:00';
                const timeB = b.startTime || '00:00';
                return timeA.localeCompare(timeB);
            });
        
        dailyBookingsContainer.innerHTML = '';
        if (bookingsOnDate.length === 0) {
            dailyBookingsContainer.innerHTML = '<p>Nenhuma reserva para este dia.</p>';
        } else {
            bookingsOnDate.forEach(booking => {
                const client = clients.find(c => c.id == booking.client_id); 
                const itemEl = document.createElement('div');
                itemEl.className = 'daily-booking-item';

                const itemsBooked = Object.entries(booking.items)
                    .filter(([, quantity]) => quantity > 0)
                    .map(([itemId, quantity]) => {
                        const item = inventory.find(i => i.id === itemId);
                        return `${item ? item.name : itemId}: ${quantity}`;
                    })
                    .join(', ');

                const timeRange = (booking.startTime && booking.endTime) ? `${booking.startTime} - ${booking.endTime}` : 'Horário não especificado';

                itemEl.innerHTML = `
                    <h4>${booking.eventName}</h4>
                    <p><strong>Cliente:</strong> ${client ? client.name : 'N/A'}</p>
                    <p><strong>Horário:</strong> ${timeRange}</p>
                    <p><strong>Itens:</strong> ${itemsBooked || 'Nenhum item'}</p>
                    <p><strong>Valor:</strong> R$ ${booking.price ? booking.price.toFixed(2).replace('.', ',') : '0,00'}</p>
                    <p><strong>Pagamento:</strong> ${booking.paymentMethod || 'N/A'}</p>
                    <p><strong>Status Pagamento:</strong> <span class="payment-status status-${booking.paymentStatus.toLowerCase()}">${booking.paymentStatus}</span></p>
                `;
                dailyBookingsContainer.appendChild(itemEl);
            });
        }
    }

    function haveTimeOverlap(start1, end1, start2, end2) {
        if (!start1 || !end1 || !start2 || !end2) return false;
        return start1 < end2 && start2 < end1;
    }

    function getAvailabilityForTimeRange(date, startTime, endTime, excludeBookingId = null) {
        const bookingsOnDate = bookings.filter(booking => booking.date === date);
        const relevantBookings = bookingsOnDate.filter(booking => 
             booking.id !== excludeBookingId && haveTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)
        );
        
        const available = {};
        
        inventory.forEach(item => {
            const used = relevantBookings.reduce((sum, booking) => sum + (booking.items[item.id] || 0), 0);
            available[item.id] = item.quantity - used;
        });
        return available;
    }
    
    function getAvailabilityForDay(date) {
         const bookingsOnDate = bookings.filter(booking => booking.date === date);
         const available = {};

         inventory.forEach(item => {
             const used = bookingsOnDate.reduce((sum, booking) => sum + (booking.items[item.id] || 0), 0);
             available[item.id] = item.quantity - used;
         });
         return available;
    }

    function updateModalAvailabilityInfo() {
        const date = addBookingDateInput.value;
        const startTime = addBookingStartTimeInput.value;
        const endTime = addBookingEndTimeInput.value;
        const submitBtn = addBookingForm.querySelector('button[type="submit"]');

        const excludeId = currentEditingBooking ? currentEditingBooking.id : null;
        
        if (!date || !startTime || !endTime) {
            modalAvailabilityInfo.textContent = 'Preencha a data e os horários para verificar a disponibilidade.';
            modalAvailabilityInfo.className = 'availability-info';
            submitBtn.disabled = true;
            submitBtn.textContent = currentEditingBooking ? 'Preencha horários para atualizar' : 'Preencha os horários';
            addBookingItemsContainer.querySelectorAll('input').forEach(input => input.removeAttribute('max'));
            updateModalItemsTotalValue(); 
            return;
        }
        
        if (endTime <= startTime) {
            modalAvailabilityInfo.textContent = 'A hora de término deve ser depois da hora de início.';
            modalAvailabilityInfo.className = 'availability-info error';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Horário Inválido';
            updateModalItemsTotalValue(); 
            return;
        }

        const availability = getAvailabilityForTimeRange(date, startTime, endTime, excludeId);

        const availabilityText = inventory.map(item => `${item.name}: ${availability[item.id]}`).join(' | ');
        modalAvailabilityInfo.textContent = `Disponível para ${startTime}-${endTime}: ${availabilityText}`;

        let hasNegativeAvailability = false;
        inventory.forEach(item => {
            const input = document.getElementById(`add-book-${item.id}`);
            if (input) {
                const availableQty = availability[item.id];
                
                let currentBookingItemQty = 0;
                if (currentEditingBooking && currentEditingBooking.items && currentEditingBooking.items[item.id]) {
                    currentBookingItemQty = currentEditingBooking.items[item.id];
                }

                if (availableQty < 0) hasNegativeAvailability = true;
                
                const adjustedAvailableQty = availableQty + currentBookingItemQty;

                input.max = Math.max(0, adjustedAvailableQty);
                
                if (parseInt(input.value, 10) > adjustedAvailableQty) {
                    input.value = Math.max(0, adjustedAvailableQty);
                }
            }
        });
        
        if (hasNegativeAvailability) {
            modalAvailabilityInfo.className = 'availability-info error';
            submitBtn.disabled = true; 
            submitBtn.textContent = 'Estoque Insuficiente';
        } else {
            modalAvailabilityInfo.className = 'availability-info';
            submitBtn.disabled = false;
            submitBtn.textContent = currentEditingBooking ? 'Atualizar Agendamento' : 'Agendar';
        }
        updateModalItemsTotalValue(); 
    }
    
    async function deleteBooking(bookingId) {
        if (await showConfirm('Tem certeza que deseja excluir esta reserva?')) {
            await supabaseDelete('bookings', bookingId);
            
            // Atualizar estado local
            const bookingIndex = bookings.findIndex(b => b.id === bookingId);
            if (bookingIndex !== -1) {
                bookings.splice(bookingIndex, 1);
                updateDailyAgenda();
                renderDatePicker(miniCalendarDate);
                renderBookings(); // Adicionado para atualizar a aba 'Reservas Confirmadas'
            }
            
            closeModal(); 
            showAlert('Reserva excluída com sucesso!');
        }
    }

    function openModal(booking) {
        const client = clients.find(c => c.id == booking.client_id); 

        modalEventName.textContent = booking.eventName;
        modalClientName.textContent = client ? client.name : 'Cliente não encontrado';
        modalEventDate.textContent = new Date(booking.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        modalPrice.textContent = booking.price ? `R$ ${booking.price.toFixed(2).replace('.', ',')}` : 'Não informado';
        modalPaymentMethod.textContent = booking.paymentMethod || 'Não especificado';

        const addressString = booking.eventAddress && [
            booking.eventAddress.street,
            booking.eventAddress.number,
            booking.eventAddress.complement,
            booking.eventAddress.neighborhood,
            booking.eventAddress.city,
            booking.eventAddress.state,
            booking.eventAddress.zip
        ].filter(Boolean).join(', ');
        modalEventAddress.textContent = addressString || 'Não informado';

        modalEventTime.textContent = (booking.startTime && booking.endTime) ? `${booking.startTime} - ${booking.endTime}` : 'Não especificado';

        const statusSpan = document.createElement('span');
        statusSpan.className = `payment-status status-${booking.paymentStatus.toLowerCase()}`;
        statusSpan.textContent = booking.paymentStatus;
        modalPaymentStatus.innerHTML = '';
        modalPaymentStatus.appendChild(statusSpan);

        modalItemsList.innerHTML = '';
        Object.entries(booking.items).filter(([, qty]) => qty > 0).forEach(([itemId, quantity]) => {
            const item = inventory.find(i => i.id === itemId);
            const li = document.createElement('li');
            li.textContent = `${item ? item.name : 'Item desconhecido'}: ${quantity}`;
            modalItemsList.appendChild(li);
        });

        if (booking.contractDataUrl) {
            modalContractLink.href = booking.contractDataUrl;
            modalContractLink.style.display = 'inline';
            modalContractLink.parentElement.querySelector('strong').style.display = 'inline';
        } else {
            modalContractLink.style.display = 'none';
            const contractStrong = modalContractLink.previousElementSibling;
            if (contractStrong && contractStrong.tagName === 'STRONG') {
                contractStrong.style.display = 'none';
            }
        }

        modalEditBookingBtn.onclick = () => handleEditBooking(booking.id);
        modalCancelBookingBtn.onclick = () => deleteBooking(booking.id);
        
        modal.style.display = 'flex';
    }

    // Helper functions for event address fields
    function clearEventAddressFields() {
        addEventZipInput.value = '';
        addEventStreetInput.value = '';
        addEventNumberInput.value = '';
        addEventComplementInput.value = '';
        addEventNeighborhoodInput.value = '';
        addEventCityInput.value = '';
        addEventStateInput.value = '';
    }

    function populateEventAddressFields(address) {
        addEventZipInput.value = address.zip || '';
        addEventStreetInput.value = address.street || '';
        addEventNumberInput.value = address.number || '';
        addEventComplementInput.value = address.complement || '';
        addEventNeighborhoodInput.value = address.neighborhood || '';
        addEventCityInput.value = address.city || '';
        addEventStateInput.value = address.state || '';
    }

    // NEW: Function to handle address option changes (radio buttons)
    function handleAddressOptionChange() {
        const selectedOption = document.querySelector('input[name="booking-address-option"]:checked').value;
        const selectedClientId = addBookingClientSelect.value;
        
        const client = selectedClientId ? clients.find(c => c.id == selectedClientId) : null;

        clearEventAddressFields(); // Always clear fields first

        if (selectedOption === 'client-address') {
            if (!client) {
                showAlert('Por favor, selecione um cliente primeiro para usar o endereço de cadastro.');
                addBookingManualAddressRadio.checked = true; // Revert to manual
                handleAddressOptionChange(); // Re-trigger to ensure correct UI state
                return;
            }
            if (client.address && Object.keys(client.address).some(k => client.address[k])) { 
                populateEventAddressFields(client.address);
                addBookingEventAddressSection.style.display = 'none'; // Hide manual fields
            } else {
                 showAlert('Este cliente não possui um endereço de cadastro principal preenchido.');
                 addBookingManualAddressRadio.checked = true; // Revert to manual
                 handleAddressOptionChange(); // Re-trigger to ensure correct UI state
                 return;
            }
        } else if (selectedOption === 'party-address') {
            if (!client) {
                showAlert('Por favor, selecione um cliente primeiro para usar o endereço da festa.');
                addBookingManualAddressRadio.checked = true; // Revert to manual
                handleAddressOptionChange(); // Re-trigger to ensure correct UI state
                return;
            }
            if (client.partyAddress && Object.keys(client.partyAddress).some(k => client.partyAddress[k])) { 
                populateEventAddressFields(client.partyAddress);
                addBookingEventAddressSection.style.display = 'none'; // Hide manual fields
            } else {
                 showAlert('Este cliente não possui um endereço de festa cadastrado.');
                 addBookingManualAddressRadio.checked = true; // Revert to manual
                 handleAddressOptionChange(); // Re-trigger to ensure correct UI state
                 return;
            }
        } else { // 'manual-address'
            addBookingEventAddressSection.style.display = 'block'; // Show manual fields
        }
    }


    function showBookingForm(bookingToEdit = null) {
        currentEditingBooking = bookingToEdit || null;
        
        addBookingModalTitle.textContent = bookingToEdit ? 'Editar Agendamento' : 'Novo Agendamento';
        addBookingSubmitBtn.textContent = bookingToEdit ? 'Atualizar Agendamento' : 'Agendar';
        
        if (bookingToEdit) {
            addBookingDateInput.value = bookingToEdit.date;
            addBookingDateDisplay.value = new Date(bookingToEdit.date + 'T00:00:00').toLocaleDateString('pt-BR');
            addBookingStartTimeInput.value = bookingToEdit.startTime || '';
            addBookingEndTimeInput.value = bookingToEdit.endTime || '';
            addEventNameInput.value = bookingToEdit.eventName;
            addBookingPriceInput.value = bookingToEdit.price || 0;
            addBookingClientSelect.value = bookingToEdit.client_id;
            addBookingPaymentMethodInput.value = bookingToEdit.paymentMethod || ''; 
            addBookingPaymentStatusInput.value = bookingToEdit.paymentStatus || ''; 
            addBookingObservationsInput.value = bookingToEdit.observations || '';
            
            // For editing, always default to manual address and populate it with existing eventAddress
            addBookingManualAddressRadio.checked = true; 
            populateEventAddressFields(bookingToEdit.eventAddress || {}); 
            addBookingEventAddressSection.style.display = 'block'; // Ensure manual fields are visible
            
        } else {
            addBookingForm.reset(); 
            addBookingDateInput.value = selectedBookingDate; 
            addBookingDateDisplay.value = new Date(selectedBookingDate + 'T00:00:00').toLocaleDateString('pt-BR'); 
            addBookingClientSelect.value = '';
            addBookingPriceInput.value = 0; 
            addBookingPaymentMethodInput.value = ''; 
            addBookingPaymentStatusInput.value = 'Pendente'; 
            addBookingObservationsInput.value = '';
            
            // For new booking, default to manual address option, clear fields
            addBookingManualAddressRadio.checked = true;
            clearEventAddressFields();
            addBookingEventAddressSection.style.display = 'block';
        }
        
        // This call is crucial to ensure the correct visibility and state based on the *initially set* radio button.
        handleAddressOptionChange(); 

        renderModalBookingFormItems(bookingToEdit);
        updateModalAvailabilityInfo();
        updateModalItemsTotalValue(); 
        
        addBookingModal.style.display = 'flex';
    }

    function closeModal(modalId = null) {
        // If a specific modalId is provided, close only that modal
        if (modalId) {
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                modalElement.style.display = 'none';
            }
        } else {
            // Otherwise, close all known modals (fallback for general dismissal)
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
        
        // Reset specific states only if the relevant modal is closed or if it's a general close
        if (modalId === 'add-booking-modal' || !modalId) {
            currentEditingBooking = null;
        }
        if (modalId === 'register-client-tab' || !modalId) { // This is a tab, not a modal, but consistent state
            currentEditingClient = null;
        }
    }

    function closeBookingForm() {
        // This function is now specifically for programmatic dismissal of all booking-related modals
        // e.g., after form submission, or when explicitly requested to reset all booking forms/views
        closeModal('add-booking-modal');
        closeModal('booking-modal'); // If a detailed view was open
        
        if (addBookingForm) addBookingForm.reset();
        if (currentEditingBooking) {
            renderModalBookingFormItems(); 
            updateModalItemsTotalValue();
        }
        currentEditingBooking = null;
    }

    function handleEditBooking(bookingId) {
        closeModal(); 
        const bookingToEdit = bookings.find(b => b.id === bookingId);
        if (bookingToEdit) {
            showBookingForm(bookingToEdit); 
        } else {
            showAlert('Reserva não encontrada para edição.');
        }
    }

    function renderModalBookingFormItems(bookingToEdit = null) {
        addBookingItemsContainer.innerHTML = '';
        inventory.forEach(item => {
            const itemGroup = document.createElement('div');
            itemGroup.className = 'form-group item-quantity-cost-group';
            const quantity = bookingToEdit && bookingToEdit.items && bookingToEdit.items[item.id] ? bookingToEdit.items[item.id] : 0;

            itemGroup.innerHTML = `
                <label for="add-book-${item.id}">${item.name}</label>
                <div class="item-inputs">
                    <input type="number" id="add-book-${item.id}" data-item-id="${item.id}" value="${quantity}" min="0" required>
                    <span class="item-unit-cost">R$ ${(item.rentalPrice || 0).toFixed(2).replace('.', ',')} / un.</span>
                </div>
            `;
            addBookingItemsContainer.appendChild(itemGroup);
        });
        addBookingItemsContainer.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', () => {
                updateModalAvailabilityInfo();
                updateModalItemsTotalValue();
            });
        });
    }

    function updateModalItemsTotalValue() {
        let totalValue = 0;
        addBookingItemsContainer.querySelectorAll('input[type="number"]').forEach(input => {
            const itemId = input.dataset.itemId;
            const quantity = parseInt(input.value, 10);
            const item = inventory.find(i => i.id === itemId);
            if (item && !isNaN(quantity) && quantity > 0) {
                totalValue += quantity * (item.rentalPrice || 0);
            }
        });
        addBookingItemsTotalValueSpan.textContent = `R$ ${totalValue.toFixed(2).replace('.', ',')}`; 
        
        if (!currentEditingBooking || addBookingPriceInput.value === '0.00' || addBookingPriceInput.value === '0') {
            addBookingPriceInput.value = totalValue.toFixed(2);
        }
    }

    async function handleUpsertBooking(e) {
        e.preventDefault();

        const clientId = addBookingClientSelect.value;
        const date = addBookingDateInput.value;
        const startTime = addBookingStartTimeInput.value;
        const endTime = addBookingEndTimeInput.value;
        const eventName = addEventNameInput.value.trim();
        const observations = addBookingObservationsInput.value.trim();
        const price = parseFloat(addBookingPriceInput.value) || 0; 
        const paymentMethod = addBookingPaymentMethodInput.value; 
        const paymentStatus = addBookingPaymentStatusInput.value; 

        // Validação específica e robusta para client_id
        if (!clientId || clientId === "" || clientId === undefined || clientId === null) {
            showAlert('Selecione um cliente antes de agendar!');
            console.error('Tentativa de agendamento com cliente inválido:', clientId);
            return;
        }

        const items = {};
        let totalItemsRequested = 0;
        const inputs = addBookingItemsContainer.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            const itemId = input.dataset.itemId;
            const quantity = parseInt(input.value, 10);
            if (!isNaN(quantity) && quantity > 0) {
                items[itemId] = quantity;
                totalItemsRequested += quantity;
            }
        });

        if (!eventName || !date || !startTime || !endTime) {
            showAlert('Por favor, preencha todos os campos obrigatórios (Evento, Data e Horário).');
            return;
        }
        if (!paymentMethod) { 
            showAlert('Por favor, selecione uma forma de pagamento.');
            return;
        }
        if (!paymentStatus) { 
            showAlert('Por favor, selecione o status do pagamento.');
            return;
        }

        if (endTime <= startTime) {
            showAlert('A hora de término deve ser posterior à hora de início.');
            return;
        }

        const availability = getAvailabilityForTimeRange(date, startTime, endTime, currentEditingBooking ? currentEditingBooking.id : null);
        let canBook = true;
        let alertMessage = `Reserva não permitida devido a conflito de estoque para ${new Date(date+'T00:00:00').toLocaleDateString('pt-BR')} (${startTime} - ${endTime}):\n`;

        Object.keys(items).forEach(itemId => {
            const requestedQty = items[itemId] || 0;
            if (requestedQty > 0) {
                 const item = inventory.find(i => i.id === itemId);
                 let availableQty = availability[itemId];

                 if (currentEditingBooking && currentEditingBooking.items && currentEditingBooking.items[itemId]) {
                     availableQty += currentEditingBooking.items[itemId];
                 }

                 if (requestedQty > availableQty) {
                     canBook = false;
                     alertMessage += `- ${item.name}: Disponível ${availableQty}, Solicitado ${requestedQty}\n`;
                 }
            }
        });

        if (!canBook) {
            showAlert(alertMessage);
            return;
        }

        let eventAddress = {};
        const selectedAddressOption = document.querySelector('input[name="booking-address-option"]:checked').value;
        const client = clients.find(c => c.id == clientId);

        if (selectedAddressOption === 'client-address') {
            eventAddress = client && client.address ? client.address : {};
        } else if (selectedAddressOption === 'party-address') {
            eventAddress = client && client.partyAddress ? client.partyAddress : {};
        } else { // manual-address
            eventAddress = {
                zip: addEventZipInput.value.trim(),
                street: addEventStreetInput.value.trim(),
                number: addEventNumberInput.value.trim(),
                complement: addEventComplementInput.value.trim(),
                neighborhood: addEventNeighborhoodInput.value.trim(),
                city: addEventCityInput.value.trim(),
                state: addEventStateInput.value.trim(),
            };
        }

        // Garantir que client_id seja uma string válida
        const safeClientId = clientId ? String(clientId) : null;
        if (!safeClientId) {
            showAlert('ID do cliente inválido. Por favor, selecione um cliente.');
            console.error('Falha na conversão do ID do cliente para string:', clientId);
            return;
        }

        const bookingData = {
            client_id: safeClientId,
            eventName,
            date,
            startTime,
            endTime,
            items,
            price,
            paymentMethod, 
            paymentStatus, 
            contractDataUrl: null, 
            eventAddress: eventAddress, 
            observations: observations
        };
        
        console.log('Booking Data antes do upsert:', bookingData);

        if (currentEditingBooking) {
            await supabaseUpsert('bookings', { 
                ...bookingData, 
                id: currentEditingBooking.id,
                client_id: bookingData.client_id,
                event_name: bookingData.eventName,
                start_time: bookingData.startTime,
                end_time: bookingData.endTime,
                payment_method: bookingData.paymentMethod,
                payment_status: bookingData.paymentStatus,
                contract_data_url: bookingData.contractDataUrl,
                event_address: bookingData.eventAddress
            });
            
            // Recarregar dados e atualizar interface
            await loadInitialData();
            showAlert('Reserva atualizada com sucesso!');
        } else {
            const newBookingId = String(Date.now());
            await supabaseUpsert('bookings', { 
                ...bookingData, 
                id: newBookingId,
                client_id: bookingData.client_id,
                event_name: bookingData.eventName,
                start_time: bookingData.startTime,
                end_time: bookingData.endTime,
                payment_method: bookingData.paymentMethod,
                payment_status: bookingData.paymentStatus,
                contract_data_url: bookingData.contractDataUrl,
                event_address: bookingData.eventAddress
            }); 
            
            // Recarregar dados e atualizar interface
            await loadInitialData();
            showAlert('Reserva adicionada com sucesso!');
        }

        closeBookingForm(); 
    }

    // Função para atualizar dados após mudanças
    function refreshAllData() {
        renderTotalInventory();
        renderInventoryManagement();
        renderClientsList(); 
        populateClientsDropdown();
        updateDailyAgenda();
        renderDatePicker(miniCalendarDate);
        renderBookings(); // Adicionado para atualizar a aba 'Reservas Confirmadas'
        renderFinancialReport();
        renderModalBookingFormItems(currentEditingBooking); 
        updateModalAvailabilityInfo();
    }



    function init() {
        // NEW: Check login status on load
        checkLoginStatus();

        // NEW: Login form submission listener
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        const today = new Date().toISOString().split('T')[0];

        if(showBookingFormBtn) showBookingFormBtn.addEventListener('click', () => showBookingForm(null));
        if(addBookingCloseButton) addBookingCloseButton.addEventListener('click', () => closeModal('add-booking-modal')); 
        if(addBookingForm) addBookingForm.addEventListener('submit', handleUpsertBooking);
        if(addBookingEndTimeInput) addBookingEndTimeInput.addEventListener('change', updateModalAvailabilityInfo); 
        if(addBookingStartTimeInput) addBookingStartTimeInput.addEventListener('change', updateModalAvailabilityInfo); 

        if(prevMonthBookingBtn) prevMonthBookingBtn.addEventListener('click', () => navigateMiniCalendar(-1));
        if(nextMonthBookingBtn) nextMonthBookingBtn.addEventListener('click', () => navigateMiniCalendar(1));

        // NEW: Event listeners for radio buttons
        if(addBookingSameAddressRadio) addBookingSameAddressRadio.addEventListener('change', handleAddressOptionChange);
        if(addBookingPartyAddressRadio) addBookingPartyAddressRadio.addEventListener('change', handleAddressOptionChange);
        if(addBookingManualAddressRadio) addBookingManualAddressRadio.addEventListener('change', handleAddressOptionChange);

        if(addEventZipInput) {
            addEventZipInput.addEventListener('input', () => formatCEPInput(addEventZipInput));
        }
        if(addBookingClientSelect) { 
            addBookingClientSelect.addEventListener('change', () => {
                // When client changes, re-evaluate the currently selected address option
                handleAddressOptionChange();
            });
        }

        bookingsList.addEventListener('click', (e) => {
            const li = e.target.closest('li[data-booking-id]');
            if (li) {
                const bookingId = li.dataset.bookingId;
                const booking = bookings.find(b => b.id == bookingId); 
                if (booking) {
                    openModal(booking);
                }
            }
        });
        
        if(modalCloseButton) modalCloseButton.addEventListener('click', () => closeModal('booking-modal'));

        tabsContainer.addEventListener('click', handleTabClick);
        addItemForm.addEventListener('submit', handleAddItem);
        
        if(confirmAddItemCloseButton) confirmAddItemCloseButton.addEventListener('click', () => closeModal('confirm-add-item-modal'));
        if(cancelAddItemBtn) cancelAddItemBtn.addEventListener('click', () => closeModal('confirm-add-item-modal')); // Keep this as it is specific to the "cancel" button action
        if(confirmAddItemBtn) confirmAddItemBtn.addEventListener('click', executeAddItem);

        inventoryListDiv.addEventListener('click', handleUpdateItem);
        inventoryListDiv.addEventListener('click', handleDeleteItem);
        
        addClientForm.addEventListener('submit', handleUpsertClient); 
        if (clientZipInput) {
            clientZipInput.addEventListener('input', () => formatCEPInput(clientZipInput));
        }
        if (partyZipInput) {
            partyZipInput.addEventListener('input', () => formatCEPInput(partyZipInput));
        }
        if (clientsListDiv) {
            clientsListDiv.addEventListener('click', handleDeleteClient);
            clientsListDiv.addEventListener('click', handleEditClient); 
        }
        hamburgerMenu.addEventListener('click', toggleMobileMenu);

        // NEW: Logout button event listener
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }

        if (clientSearchInput) {
            clientSearchInput.addEventListener('input', (e) => {
                clientSearchQuery = e.target.value;
                renderClientsList(); 
            });
        }

        if (financialPeriodSelect && financialYearSelect) {
            financialPeriodSelect.addEventListener('change', renderFinancialReport);
            financialYearSelect.addEventListener('change', renderFinancialReport);
            updateFinancialReportBtn.addEventListener('click', renderFinancialReport);
            printFinancialReportBtn.addEventListener('click', printFinancialReport);
            initializeFinancialTab();
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            }
        });

        document.querySelector('.quick-add-grid').addEventListener('click', handleQuickAdd);

        toggleAddItemFormBtn.addEventListener('click', () => {
            addItemSection.classList.toggle('hidden');
        });
        
        // Carregar dados iniciais do Supabase
        setTimeout(() => {
            loadInitialData();
        }, 1000); // Aguardar um pouco para garantir que o Supabase foi carregado
    }
    
    function renderBookings() {
        bookingsList.innerHTML = '';
        
        const sortedBookings = [...bookings].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
            const timeA = a.startTime || '00:00';
            const timeB = b.startTime || '00:00';
            return timeA.localeCompare(timeB);
        });

        if (sortedBookings.length === 0) {
            bookingsList.innerHTML = '<p>Nenhuma reserva confirmada.</p>';
            return;
        }

        sortedBookings.forEach(booking => {
            const client = clients.find(c => c.id == booking.client_id); 
            const li = document.createElement('li');
            li.setAttribute('data-booking-id', booking.id);

            const itemsBooked = Object.entries(booking.items)
                .filter(([, quantity]) => quantity > 0)
                .map(([itemId, quantity]) => {
                    const item = inventory.find(i => i.id === itemId);
                    return `${item ? item.name : 'Item desconhecido'}: ${quantity}`;
                })
                .join('<br>');

            const contractLinkHtml = booking.contractDataUrl
                ? `<a href="${booking.contractDataUrl}" target="_blank" rel="noopener noreferrer" class="contract-link" onclick="event.stopPropagation()">Ver Contrato</a>`
                : 'Sem Contrato';

            const addressString = booking.eventAddress && [
                booking.eventAddress.street,
                booking.eventAddress.number,
                booking.eventAddress.complement,
                booking.eventAddress.neighborhood,
                booking.eventAddress.city,
                booking.eventAddress.state,
                booking.eventAddress.zip
            ].filter(Boolean).join(', ');

            const timeRange = (booking.startTime && booking.endTime) ? `${booking.startTime} - ${booking.endTime}` : 'Não especificado';

            li.innerHTML = `
                <div class="booking-info-wrapper">
                    <div class="booking-details">
                        <strong>${booking.eventName}</strong>
                        <span class="client-name"><i class="fas fa-user-circle"></i> ${client ? client.name : 'N/A'}</span>
                        <span class="booking-address"><i class="fas fa-map-marker-alt"></i> ${addressString || 'Endereço não informado'}</span>
                        <small><i class="fas fa-calendar-alt"></i> ${new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')} <i class="fas fa-clock"></i> ${timeRange}</small>
                        <p>Itens: ${itemsBooked || 'Nenhum item'}</p>
                    </div>
                    <div class="booking-meta">
                        <p>R$ ${booking.price ? booking.price.toFixed(2).replace('.', ',') : '0,00'}</p>
                        <p>${booking.paymentMethod || 'N/A'}</p>
                        <span class="payment-status status-${booking.paymentStatus.toLowerCase()}">${booking.paymentStatus}</span>
                        ${contractLinkHtml}
                        <button class="delete-btn" data-id="${booking.id}">Excluir</button>
                    </div>
                </div>
            `;
            bookingsList.appendChild(li);
        });
    }

    init();
});