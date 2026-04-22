from mcp.server.fastmcp import FastMCP
import httpx
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env en la misma carpeta que el script
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api")
API_KEY = os.getenv("API_KEY")

if not API_KEY:
    raise ValueError("Falta configurar la variable de entorno API_KEY. Por favor, revisá tu archivo .env.")

# Configurar el puerto dinámicamente para Render (por defecto 8001 en local)
port = int(os.getenv("PORT", 8001))
mcp = FastMCP("Mediciones App", port=port, host="0.0.0.0")

def get_client():
    """Retorna un cliente HTTP configurado con la URL base y la API Key."""
    return httpx.Client(
        base_url=API_BASE_URL,
        headers={"Authorization": f"Api-Key {API_KEY}"}
    )

@mcp.tool()
def get_categories() -> list:
    """Obtiene la lista de todas las categorías disponibles del usuario."""
    with get_client() as client:
        response = client.get("/categories/")
        response.raise_for_status()
        return response.json()

@mcp.tool()
def get_entries(category_id: int) -> list:
    """Obtiene los registros (mediciones) de una categoría específica."""
    with get_client() as client:
        response = client.get(f"/entries/?category={category_id}")
        response.raise_for_status()
        return response.json()

@mcp.tool()
def add_entry(category_id: int, value: float, note: str = "") -> dict:
    """Agrega un nuevo registro (medición) a una categoría específica. 
    Asegurate de usar el category_id correcto obtenido de get_categories()."""
    with get_client() as client:
        payload = {
            "category": category_id,
            "value": value,
            "note": note
        }
        response = client.post("/entries/", json=payload)
        response.raise_for_status()
        return response.json()

@mcp.tool()
def create_category(name: str, unit: str, icon: str = "") -> dict:
    """Crea una nueva categoría para hacer seguimiento (ej. name='Pasos', unit='pasos', icon='shoes')."""
    with get_client() as client:
        payload = {
            "name": name,
            "unit": unit,
            "icon": icon
        }
        response = client.post("/categories/", json=payload)
        response.raise_for_status()
        return response.json()

if __name__ == "__main__":
    import sys
    # Verifica si se pasó el argumento --sse por consola
    if "--sse" in sys.argv:
        print("Iniciando servidor MCP en modo web (SSE)...")
        # Inicia el servidor usando transporte SSE (para nube/web)
        mcp.run(transport="sse")
    else:
        # Inicia el servidor usando transporte stdio (estándar para clientes locales como Claude Desktop)
        mcp.run()
