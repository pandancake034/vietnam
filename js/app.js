// === Firebase Initialisatie ===
const firebaseConfig = {
    apiKey: "AIzaSyDIie6rsUl6oNoIbJeqfxqLcWT02xQTU_Y",
    authDomain: "vietnamv2-de066.firebaseapp.com",
    projectId: "vietnamv2-de066",
    storageBucket: "vietnamv2-de066.appspot.com",
    messagingSenderId: "793608640911",
    appId: "1:793608640911:web:6924a0e6c1b8c8d30093fa"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const expensesCollection = db.collection('expenses');
const itineraryCollection = db.collection('itinerary');

// === HERBRUIKBARE COMPONENTEN & HOOKS ===

// --- Custom Hook voor Firestore data ---
const useFirestoreQuery = (query) => {
    const [data, setData] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const unsubscribe = query.onSnapshot(snapshot => {
            const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(fetchedData);
            setIsLoading(false);
        }, err => {
            console.error(err);
            setError("Data kon niet worden geladen.");
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []); // Afhankelijkheden bewust leeg gelaten voor eenmalige setup

    return { data, isLoading, error };
};

// --- Custom Hook voor Weerdata ---
const useWeather = (locations) => {
    const [weatherData, setWeatherData] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const promises = locations.map(async (location) => {
                    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=weathercode,temperature_2m_max,precipitation_sum&timezone=Asia/Ho_Chi_Minh&forecast_days=3`);
                    if (!response.ok) throw new Error('Weerdata kon niet worden opgehaald.');
                    const data = await response.json();
                    return { name: location.name, ...data };
                });
                const results = await Promise.all(promises);
                setWeatherData(results);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWeatherData();
    }, [locations]);

    return { weatherData, isLoading, error };
};

// --- UI Componenten ---
const Card = ({ children, className = '' }) => (
    <div className={`bg-surface p-4 rounded-lg shadow ${className}`}>
        {children}
    </div>
);

const InfoCard = ({ icon, title, children }) => (
    <Card>
        <div className="flex items-center mb-2">
            <i className={`fa-solid ${icon} text-accent mr-3`}></i>
            <h3 className="font-bold text-text-primary">{title}</h3>
        </div>
        {children}
    </Card>
);

const LoadingSpinner = ({ message = 'Laden...' }) => (
    <div className="text-center p-8">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-accent"></i>
        {message && <p className="mt-4">{message}</p>}
    </div>
);

const ErrorMessage = ({ message }) => (
    <div className="text-center p-8 text-red-500">
        <i className="fa-solid fa-exclamation-triangle text-4xl"></i>
        <p className="mt-4">Fout: {message}</p>
    </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50"><i className="fa-solid fa-arrow-left"></i></button>
            <span className="text-sm font-semibold">Pagina {currentPage} van {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50"><i className="fa-solid fa-arrow-right"></i></button>
        </div>
    );
};

const PlaceholderPage = ({ title }) => (
    <Card>
        <h2 className="text-2xl font-bold text-center text-text-secondary">{title}</h2>
        <p className="text-center text-text-secondary mt-2">Deze pagina is nog in ontwikkeling.</p>
    </Card>
);

// === PAGINA COMPONENTEN (opgeschoond) ===

function HomePage() {
    return (
        <div className="space-y-4">
            <InfoCard icon="fa-map-pin" title="Volgende bestemming">
                <p className="text-2xl font-semibold">Hoi An</p>
                <p className="text-sm text-text-secondary">Check-in: 28 juli 2025</p>
            </InfoCard>
            <InfoCard icon="fa-cloud-sun" title="Huidig weer in Hanoi">
                <p className="text-2xl font-semibold">29°C, Gedeeltelijk bewolkt</p>
                <p className="text-sm text-text-secondary">Neerslag: 1.2 mm verwacht</p>
            </InfoCard>
            <InfoCard icon="fa-plane" title="Volgende vlucht">
                <p className="text-xl font-semibold">Hanoi (HAN) <i className="fa-solid fa-arrow-right text-sm"></i> Da Nang (DAD)</p>
                <p className="text-sm text-text-secondary">Vlucht VJ513 - 30 juli 2025, 11:45</p>
            </InfoCard>
            <InfoCard icon="fa-wallet" title="Laatste uitgave">
                <p className="text-xl font-semibold">€ 2,00 - Banh Mi Sandwich</p>
                <p className="text-sm text-text-secondary">Betaald door: Dewika</p>
            </InfoCard>
        </div>
    );
}

function WeatherPage() {
    const locations = React.useMemo(() => [
        { name: 'Hanoi', lat: 21.0285, lon: 105.8542 }, { name: 'Sapa', lat: 22.3365, lon: 103.8445 },
        { name: 'Meo Vac', lat: 23.1611, lon: 105.4111 }, { name: 'Dong Van', lat: 23.2783, lon: 105.3601 },
        { name: 'Hoi An', lat: 15.8801, lon: 108.3380 }, { name: 'Ho Chi Minh City', lat: 10.7769, lon: 106.7009 }
    ], []);
    
    const { weatherData, isLoading, error } = useWeather(locations);

    const getWeatherIcon = (code) => {
        if (code >= 0 && code <= 1) return 'fa-sun'; if (code === 2) return 'fa-cloud-sun'; if (code === 3) return 'fa-cloud';
        if (code >= 51 && code <= 67) return 'fa-cloud-showers-heavy'; if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy';
        if (code >= 71 && code <= 77) return 'fa-snowflake'; if (code >= 95 && code <= 99) return 'fa-cloud-bolt';
        return 'fa-smog';
    };

    if (isLoading) return <LoadingSpinner message="Weerdata laden..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-6">
            {weatherData.map((locationData) => (
                <Card key={locationData.name}>
                    <h3 className="font-bold text-xl mb-3">{locationData.name}</h3>
                    <div className="space-y-3">
                        {locationData.daily.time.map((day, dayIndex) => (
                            <div key={day} className="flex items-center justify-between border-b border-border pb-2 last:border-b-0">
                                <div className="w-1/3"><p className="font-semibold">{new Date(day).toLocaleDateString('nl-NL', { weekday: 'long' })}</p><p className="text-sm text-text-secondary">{new Date(day).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</p></div>
                                <div className="w-1/3 text-center"><i className={`fa-solid ${getWeatherIcon(locationData.daily.weathercode[dayIndex])} text-3xl text-accent`}></i></div>
                                <div className="w-1/3 text-right"><p className="font-semibold text-lg">{Math.round(locationData.daily.temperature_2m_max[dayIndex])}°C</p><p className="text-sm text-text-secondary"><i className="fa-solid fa-droplet"></i> {locationData.daily.precipitation_sum[dayIndex]} mm</p></div>
                            </div>
                        ))}
                    </div>
                </Card>
            ))}
        </div>
    );
}

function ExpensesPage() {
    const { data: expenses, isLoading } = useFirestoreQuery(expensesCollection.orderBy('createdAt', 'desc'));
    const [description, setDescription] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const [paidBy, setPaidBy] = React.useState('Dewika');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;

    const handleAddExpense = async (event) => {
        event.preventDefault();
        if (!description || !amount) { alert('Vul een omschrijving en een bedrag in.'); return; }
        await expensesCollection.add({ description, amount: parseFloat(amount), paidBy, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        setDescription(''); setAmount('');
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm("Weet je zeker dat je deze uitgave wilt verwijderen?")) {
            await expensesCollection.doc(id).delete();
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const currentItems = expenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(expenses.length / itemsPerPage);

    return (
        <div>
        <Card className="mb-6">
            <h3 className="font-bold text-lg mb-3">Nieuwe uitgave</h3>
            <form onSubmit={handleAddExpense} className="space-y-3">
            <input type="text" placeholder="Omschrijving" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-border rounded-md" />
            <input type="number" step="0.01" placeholder="Bedrag in € (EUR)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border border-border rounded-md" />
            <div className="flex items-center space-x-4">
                <label className="font-semibold">Betaald door:</label>
                <div className="flex items-center"> <input type="radio" id="dewika" name="paidBy" value="Dewika" checked={paidBy === 'Dewika'} onChange={(e) => setPaidBy(e.target.value)} /> <label htmlFor="dewika" className="ml-2">Dewika</label> </div>
                <div className="flex items-center"> <input type="radio" id="reisgenoot" name="paidBy" value="Reisgenoot" checked={paidBy === 'Reisgenoot'} onChange={(e) => setPaidBy(e.target.value)} /> <label htmlFor="reisgenoot" className="ml-2">Reisgenoot</label> </div>
            </div>
            <button type="submit" className="w-full bg-accent text-white font-bold p-2 mt-1 rounded-md hover:bg-blue-600 transition-colors">Toevoegen</button>
            </form>
        </Card>

        <Card>
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">Recente uitgaven</h3>
                <div className="font-bold text-lg text-accent">{formatCurrency(totalAmount)}</div>
            </div>
            {isLoading ? <LoadingSpinner /> : expenses.length === 0 ? (
            <p className="text-text-secondary text-center p-4">Nog geen uitgaven toegevoegd.</p>
            ) : (
            <div className="space-y-3">
                {currentItems.map(expense => (
                <div key={expense.id} className="border-b border-border pb-2 last:border-b-0 flex justify-between items-center">
                    <div><p className="font-semibold">{expense.description}</p><p className="text-sm text-text-secondary">Betaald door {expense.paidBy}</p></div>
                    <div className="flex items-center space-x-4"><p className="font-semibold">{formatCurrency(expense.amount)}</p><button onClick={() => handleDeleteExpense(expense.id)} className="text-text-secondary hover:text-red-500"><i className="fa-solid fa-trash-can"></i></button></div>
                </div>
                ))}
            </div>
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </Card>
        </div>
    );
}

function ItineraryPage() {
    const { data: itinerary, isLoading } = useFirestoreQuery(itineraryCollection.orderBy('date'));
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [animationClass, setAnimationClass] = React.useState('');
    const touchStartX = React.useRef(0);

    const uniqueDates = React.useMemo(() => [...new Set(itinerary.map(item => item.date))].sort(), [itinerary]);

    React.useEffect(() => {
        if (uniqueDates.length > 0) {
            const today = new Date().toISOString().slice(0, 10);
            const todayIndex = uniqueDates.indexOf(today);
            setCurrentIndex(todayIndex !== -1 ? todayIndex : 0);
        }
    }, [uniqueDates]);

    const handleToggleComplete = async (id, currentStatus) => {
        await itineraryCollection.doc(id).update({ completed: !currentStatus });
    };

    const changeDay = (direction) => {
        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= uniqueDates.length) return;
        setAnimationClass(direction > 0 ? 'slide-out-left' : 'slide-out-right');
        setTimeout(() => {
            setCurrentIndex(newIndex);
            setAnimationClass(direction > 0 ? 'slide-in-from-right' : 'slide-in-from-left');
            setTimeout(() => setAnimationClass(''), 10); 
        }, 300);
    };
    
    const handleDateChange = (e) => {
        const newIndex = uniqueDates.indexOf(e.target.value);
        if (newIndex !== -1) setCurrentIndex(newIndex);
    };
    
    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(deltaX) > 50) changeDay(deltaX < 0 ? 1 : -1);
    };

    if (isLoading) return <LoadingSpinner />;
    
    const selectedDate = uniqueDates[currentIndex];
    const itemsForSelectedDate = itinerary.filter(item => item.date === selectedDate);

    return (
        <div className="flex flex-col h-full">
            <Card className="mb-4 !p-2 flex items-center justify-between">
                <button onClick={() => changeDay(-1)} disabled={currentIndex === 0} className="p-2 disabled:opacity-25"><i className="fa-solid fa-chevron-left"></i></button>
                <input type="date" value={selectedDate || ''} onChange={handleDateChange} className="border-none text-center font-bold text-lg bg-transparent"/>
                <button onClick={() => changeDay(1)} disabled={currentIndex >= uniqueDates.length - 1} className="p-2 disabled:opacity-25"><i className="fa-solid fa-chevron-right"></i></button>
            </Card>
            <div className="flex-grow overflow-y-auto" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <div className={`day-container bg-surface p-4 rounded-lg shadow ${animationClass}`}>
                    {itemsForSelectedDate.length > 0 ? (
                        <div>
                            <h3 className="font-bold text-xl mb-3 border-b border-border pb-2">
                                {new Date(selectedDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                                <span className="text-sm font-normal text-text-secondary ml-2">({itemsForSelectedDate[0].city})</span>
                            </h3>
                            <div className="space-y-4">
                                {itemsForSelectedDate.map(item => (
                                    <div key={item.id} className="flex items-start space-x-3">
                                        <input type="checkbox" checked={item.completed} onChange={() => handleToggleComplete(item.id, item.completed)} className="mt-1 h-5 w-5 rounded border-gray-300 text-accent focus:ring-accent" />
                                        <div className="flex-1">
                                            <p className={`font-semibold ${item.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{item.activity}</p>
                                            <p className="text-sm text-text-secondary">{item.notes}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-text-secondary p-8">Geen planning voor deze dag.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// === Hoofd App Component ===
function App() {
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);
    const [activePage, setActivePage] = React.useState('Home');
    const [isAuthenticating, setIsAuthenticating] = React.useState(true);

    React.useEffect(() => {
        const signIn = async () => {
        try { if (!auth.currentUser) { await auth.signInAnonymously(); } } 
        catch (error) { console.error("Fout bij anoniem inloggen:", error); } 
        finally { setIsAuthenticating(false); }
        };
        signIn();
    }, []);

    const navigateTo = (page) => { setActivePage(page); setSidebarOpen(false); };
    const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? 'Goedenacht' : h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond'; };

    const pageComponents = {
        'Home': <HomePage />, 'Reisschema': <ItineraryPage />,
        'Hotels': <PlaceholderPage title="Hotels" />, 'Vliegschema': <PlaceholderPage title="Vliegschema" />,
        'Uitgaven': <ExpensesPage />, 'Weer': <WeatherPage />,
    };

    const navItems = [
        { page: 'Home', icon: 'fa-home', label: 'Home' },
        { page: 'Reisschema', icon: 'fa-route', label: 'Reisschema' },
        { page: 'Hotels', icon: 'fa-hotel', label: 'Hotels' },
        { page: 'Vliegschema', icon: 'fa-plane-departure', label: 'Vliegschema' },
        { page: 'Uitgaven', icon: 'fa-money-bill-wave', label: 'Uitgaven' },
        { page: 'Weer', icon: 'fa-cloud-sun-rain', label: 'Weer' },
    ];

    if (isAuthenticating) return <div className="max-w-md mx-auto h-screen flex items-center justify-center"><LoadingSpinner message="" /></div>;

    return (
        <div className="max-w-md mx-auto h-screen bg-background shadow-lg flex flex-col">
        <aside className={`fixed top-0 left-0 h-full w-64 bg-surface text-text-primary p-6 z-50 transform transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-accent">Menu</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-2xl text-text-secondary"><i className="fa-solid fa-times"></i></button>
            </div>
            <nav><ul className="space-y-4">
                {navItems.map(item => (
                    <li key={item.page}>
                        <button onClick={() => navigateTo(item.page)} className="flex items-center space-x-3 text-lg hover:text-accent w-full text-left">
                            <i className={`fa-solid ${item.icon} fa-fw`}></i><span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul></nav>
        </aside>
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
        
        <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
            <button onClick={() => setSidebarOpen(true)} className="text-text-primary w-10 h-10 flex flex-col justify-center items-start space-y-1.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 18H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <div className="flex-grow text-center">
                <p className="text-sm text-text-secondary">{getGreeting()}</p>
                <h1 className="text-lg font-bold text-text-primary">Hello, Dewika</h1>
            </div>
            <div className="w-10 h-10"><img src="https://i.pravatar.cc/150?u=dewika" alt="Profielfoto" className="w-full h-full rounded-full object-cover" /></div>
        </header>
        
        <main className="flex-grow p-4 overflow-y-auto">
            {pageComponents[activePage]}
        </main>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));