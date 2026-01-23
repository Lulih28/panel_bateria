from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from .models import BatteryRecord
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger


def test_canvas(request):
	"""Vista de prueba para Canvas y Chart.js"""
	return render(request, 'mi_app/test_canvas.html')


def battery_simple(request):
	"""Vista simplificada de batería con gráficos en canvas"""
	return render(request, 'mi_app/battery_simple.html')


def battery_refactored(request):
	"""Vista refactorizada - Ruta alternativa
	
	Esta vista proporciona acceso a la aplicación de monitoreo de batería
	a través de una ruta alternativa (/battery-refactored/).
	
	Utiliza la misma plantilla que /battery/ (battery_simple.html) la cual
	implementa una arquitectura limpia con:
	- Servicios: lógica de negocio
	- Controladores: coordinación
	- Canvas API: visualización de datos sin dependencias externas
	
	La arquitectura está optimizada para:
	- Modularidad: Código organizado en funciones reutilizables
	- Mantenibilidad: Separación clara de responsabilidades
	- Rendimiento: Sin frameworks JavaScript innecesarios
	- Accesibilidad: CORS habilitado para acceso desde dispositivos móviles
	"""
	return render(request, 'mi_app/battery_simple.html')


@require_http_methods(["GET", "POST"])
def battery_view(request):
	"""Vista que muestra el nivel de batería y guarda registros.

	- GET: renderiza la plantilla con el último registro y lista reciente.
	- POST: acepta `level` (0-100) y opcional `device_id` desde form o JSON y guarda el registro.
	"""
	if request.method == "POST":
		# Soportar JSON y form-encoded
		level = None
		device_id = None
		if request.content_type and "application/json" in request.content_type:
			try:
				import json

				data = json.loads(request.body.decode("utf-8"))
			except Exception:
				return HttpResponseBadRequest("JSON inválido")
			level = data.get("level")
			device_id = data.get("device_id")
		else:
			level = request.POST.get("level")
			device_id = request.POST.get("device_id")

		try:
			level_int = int(float(level))
		except Exception:
			return HttpResponseBadRequest("Nivel inválido")

		if level_int < 0 or level_int > 100:
			return HttpResponseBadRequest("Nivel fuera de rango")

		rec = BatteryRecord.objects.create(level=level_int, device_id=device_id)

		if request.content_type and "application/json" in request.content_type:
			return JsonResponse({"status": "ok", "id": rec.id, "level": rec.level})

		return redirect("battery")

	# GET
	latest = BatteryRecord.objects.order_by("-created_at").first()
	all_records = BatteryRecord.objects.all().order_by('-created_at')
	# paginación
	page = request.GET.get('page', 1)
	paginator = Paginator(all_records, 10)  # 10 por página
	try:
		records_page = paginator.page(page)
	except PageNotAnInteger:
		records_page = paginator.page(1)
	except EmptyPage:
		records_page = paginator.page(paginator.num_pages)

	return render(request, "mi_app/battery.html", {"latest": latest, "records": records_page, "paginator": paginator})
