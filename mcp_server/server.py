from mcp.server.fastmcp import FastMCP
import httpx
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api")
API_KEY = os.getenv("API_KEY")

if not API_KEY:
    raise ValueError("Falta configurar la variable de entorno API_KEY. Por favor, revisá tu archivo .env.")

port = int(os.getenv("PORT", 8001))
mcp = FastMCP("Mediciones App", port=port, host="0.0.0.0")

def get_client():
    """Retorna un cliente HTTP configurado con la URL base y la API Key."""
    return httpx.Client(
        base_url=API_BASE_URL,
        headers={"Authorization": f"Api-Key {API_KEY}"},
        timeout=60.0
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
def add_entry(category_id: int, value: float, note: str = "", created_at: str = None) -> dict:
    """Agrega un nuevo registro (medición) a una categoría específica. 
    Asegurate de usar el category_id correcto obtenido de get_categories().
    Podés especificar 'created_at' (en formato ISO 8601, ej. '2023-10-25T14:30:00Z') para agregar registros pasados."""
    with get_client() as client:
        payload = {
            "category": category_id,
            "value": value,
            "note": note
        }
        if created_at:
            payload["created_at"] = created_at
            
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

@mcp.tool()
def delete_category(category_id: int) -> str:
    """Elimina permanentemente una categoría y todos sus registros asociados.
    Asegurate de usar el category_id correcto."""
    with get_client() as client:
        response = client.delete(f"/categories/{category_id}/")
        response.raise_for_status()
        return f"Categoría {category_id} eliminada correctamente."

@mcp.tool()
def delete_entry(entry_id: int) -> str:
    """Elimina permanentemente un registro (medición) específico.
    Asegurate de usar el id del registro (no de la categoría)."""
    with get_client() as client:
        response = client.delete(f"/entries/{entry_id}/")
        response.raise_for_status()
        return f"Registro {entry_id} eliminado correctamente."

@mcp.tool()
def update_category(category_id: int, name: str = None, unit: str = None, icon: str = None) -> dict:
    """Actualiza los datos de una categoría existente.
    Solo proporcioná los valores que querés cambiar (los que no envíes quedarán igual)."""
    with get_client() as client:
        payload = {}
        if name is not None: payload["name"] = name
        if unit is not None: payload["unit"] = unit
        if icon is not None: payload["icon"] = icon
            
        response = client.patch(f"/categories/{category_id}/", json=payload)
        response.raise_for_status()
        return response.json()

@mcp.tool()
def update_entry(entry_id: int, value: float = None, note: str = None) -> dict:
    """Actualiza el valor o la nota de un registro (medición) existente.
    Solo proporcioná los valores que querés cambiar (los que no envíes quedarán igual).
    Asegurate de usar el id del registro (no de la categoría)."""
    with get_client() as client:
        payload = {}
        if value is not None: payload["value"] = value
        if note is not None: payload["note"] = note
            
        response = client.patch(f"/entries/{entry_id}/", json=payload)
        response.raise_for_status()
        return response.json()

if __name__ == "__main__":
    import sys
    if "--sse" in sys.argv:
        print("Iniciando servidor MCP en modo web (SSE)...")
        mcp.run(transport="sse")
    else:
        mcp.run()
