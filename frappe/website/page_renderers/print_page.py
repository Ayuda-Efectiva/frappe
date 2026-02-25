import frappe
from frappe.website.page_renderers.template_page import TemplatePage


class PrintPage(TemplatePage):
	"""
	default path returns a printable object (based on permission)
	/Quotation/Q-0001
	"""

	def can_render(self):
		parts = self.path.split("/", 1)
		if len(parts) != 2 or not frappe.db.exists("DocType", parts[0], True):
			return False

		# <DFP. Forzamos False
		# TODO: eliminar a partir del 26.06.01 si no se loguea este error!
		frappe.log_error(title="Cae aquí alguna vez? PrintPage(TemplatePage)->can_render")
		return False
		# DFP>
		return True

	def render(self):
		parts = self.path.split("/", 1)
		frappe.form_dict.doctype = parts[0]
		frappe.form_dict.name = parts[1]
		self.set_standard_path("printview")
		return super().render()
