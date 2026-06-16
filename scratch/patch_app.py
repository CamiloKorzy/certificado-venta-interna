import re

def update_app():
    with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add import GestorInformes
    if "import GestorInformes" not in content:
        content = content.replace(
            "import InformeGestion from './components/InformeGestion';",
            "import InformeGestion from './components/InformeGestion';\nimport GestorInformes from './components/GestorInformes';"
        )

    # 2. Add globalUnidad and globalPeriodo state to App
    # Look for: const currentPeriod = `${currentMonth}/${currentYear}`;
    # We can inject after `const [fetchError, setFetchError] = useState<string | null>(null);` inside `function App()`
    # Oh wait, `function App` is at the end? Let's find `export default function App` or `function App`
    
    app_func_match = re.search(r'function App\(\) \{.*?(const \[token.*?);', content, re.DOTALL)
    if not app_func_match:
        app_func_match = re.search(r'export default function App\(\) \{.*?(const \[token.*?);', content, re.DOTALL)

    if "const [globalUnidad" not in content:
        # Actually I can just replace `const [view, setView] = useState('dashboard');` with my states
        content = content.replace(
            "const [view, setView] = useState('dashboard');",
            "const [view, setView] = useState('proyectos');\n  const [globalUnidad, setGlobalUnidad] = useState<string | undefined>(undefined);\n  const [globalPeriodo, setGlobalPeriodo] = useState<string | undefined>(undefined);"
        )

    # 3. Add 'Proyectos' to Nav
    nav_item = """
              <button onClick={() => setView('proyectos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'proyectos' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                <span className="flex items-center gap-1.5"><FileText size={15} /> Proyectos</span>
              </button>
"""
    if "setView('proyectos')" not in content:
        content = content.replace(
            '<nav className="flex gap-1">',
            '<nav className="flex gap-1">\n' + nav_item
        )

    # 4. Update the render lines
    # Old lines:
    # {view === 'dashboard' && <MainDashboard token={token} defaultUnidad={user?.sucursales?.[0]} />}
    # {view === 'ingresos' && <Dashboard token={token} onLogout={handleLogout} defaultUnidad={user?.sucursales?.[0]} />}
    
    if "<GestorInformes" not in content:
        # We need to replace `defaultUnidad={user?.sucursales?.[0]}` with `defaultUnidad={globalUnidad || user?.sucursales?.[0]} defaultPeriodo={globalPeriodo}`
        # Also need to make MainDashboard, Gastos, etc. accept defaultPeriodo!
        
        # Patch the functions first
        funcs = ["MainDashboard", "Gastos", "RRHH", "Asientos"]
        for fn in funcs:
            content = re.sub(
                f"function {fn}\\({{ token, defaultUnidad }}: {{ token: string, defaultUnidad\\?: string }}\\) {{",
                f"function {fn}({{ token, defaultUnidad, defaultPeriodo }}: {{ token: string, defaultUnidad?: string, defaultPeriodo?: string }}) {{",
                content
            )
            content = re.sub(
                f"<InformeGestion token={{token}} mode=\"([a-z]+)\" defaultUnidad={{defaultUnidad}} />",
                f"<InformeGestion token={{token}} mode=\"\\1\" defaultUnidad={{defaultUnidad}} defaultPeriodo={{defaultPeriodo}} />",
                content
            )

        # Patch the renders inside App
        for fn in ["MainDashboard", "Gastos", "RRHH", "Asientos"]:
            content = content.replace(
                f"<{fn} token={{token}} defaultUnidad={{user?.sucursales?.[0]}} />",
                f"<{fn} token={{token}} defaultUnidad={{globalUnidad || user?.sucursales?.[0]}} defaultPeriodo={{globalPeriodo}} />"
            )

        # Dashboard for ingresos
        content = content.replace(
            "<Dashboard token={token} onLogout={handleLogout} defaultUnidad={user?.sucursales?.[0]} />",
            "<Dashboard token={token} onLogout={handleLogout} defaultUnidad={globalUnidad || user?.sucursales?.[0]} />"
        )
        
        # Inject GestorInformes render
        content = content.replace(
            "{view === 'dashboard' && <MainDashboard",
            "{view === 'proyectos' && <GestorInformes token={token} user={user} onOpenReport={(u: string, p: string) => { setGlobalUnidad(u); setGlobalPeriodo(p); setView('dashboard'); }} />}\n      {view === 'dashboard' && <MainDashboard"
        )

    with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("App.tsx updated.")

if __name__ == '__main__':
    update_app()
