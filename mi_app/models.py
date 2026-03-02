from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='categories', null=True) # Link to Django User
    unit = models.CharField(max_length=50, blank=True, null=True) # e.g., "metros", "kg", "%"
    icon = models.CharField(max_length=50, default="📊") # e.g., emoji or icon name
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        unique_together = ('user', 'name') # Unique per user

    def __str__(self):
        return self.name

class TrackEntry(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="entries")
    value = models.FloatField()
    note = models.TextField(blank=True, null=True)
    device_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.category.name}: {self.value} {self.category.unit or ''} at {self.created_at}"

