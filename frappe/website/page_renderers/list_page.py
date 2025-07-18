import frappe
from frappe.website.page_renderers.template_page import TemplatePage


class ListPage(TemplatePage):
	def can_render(self):
		# DFP added check if has_web_view if not not allowed to be rendered; problem: dt as dict makes query not cacheable
		return frappe.db.exists(dt={"doctype": "DocType", "name": self.path, "has_web_view": 1})

	def render(self):
		frappe.local.form_dict.doctype = self.path
		self.set_standard_path("list")
		return super().render()
