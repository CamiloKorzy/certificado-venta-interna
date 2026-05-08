from fastapi import FastAPI
import os, sys, traceback

app = FastAPI()

@app.get("/health")
def h():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    info = {"alive": True, "python": sys.version}
    
    # Verificar sintaxis de main.py
    try:
        import py_compile
        py_compile.compile(os.path.join(backend_dir, "main.py"), doraise=True)
        info["main_syntax"] = "OK"
    except Exception as e:
        info["main_syntax"] = str(e)
    
    # Verificar sintaxis de auth.py
    try:
        import py_compile
        py_compile.compile(os.path.join(backend_dir, "auth.py"), doraise=True)
        info["auth_syntax"] = "OK"
    except Exception as e:
        info["auth_syntax"] = str(e)
    
    # Intentar importar auth
    try:
        import auth
        info["auth_import"] = "OK"
    except Exception as e:
        info["auth_import"] = str(e)
        info["auth_trace"] = traceback.format_exc()
    
    # Intentar importar main
    try:
        import main as m
        info["main_import"] = "OK"
    except Exception as e:
        info["main_import"] = str(e)
        info["main_trace"] = traceback.format_exc()
    
    return info
