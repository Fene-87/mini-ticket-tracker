from django.urls import path

from . import views

# No trailing slashes, matching the API spec (and avoiding APPEND_SLASH redirects on POST).
urlpatterns = [
    path('tickets', views.TicketListCreateView.as_view(), name='ticket-list'),
    path('tickets/stats', views.TicketStatsView.as_view(), name='ticket-stats'),
    path('tickets/<int:pk>', views.TicketDetailView.as_view(), name='ticket-detail'),
]
