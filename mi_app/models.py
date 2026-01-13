from django.db import models


# Modelo para guardar registros del nivel de batería
class BatteryRecord(models.Model):
	level = models.PositiveSmallIntegerField()
	device_id = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		dev = self.device_id or "unknown"
		return f"{dev} - {self.level}% at {self.created_at}"
