from django.shortcuts import render

def battery_simple(request):
	"""Vista simplificada de batería con gráficos en canvas"""
	return render(request, 'mi_app/battery_simple.html')
