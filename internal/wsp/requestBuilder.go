package wsp

func BuildInfoRequest(name, phone, creationDate string) TemplateData {
	return TemplateData{
		TemplateName: "info_request",
		BodyVars: []TemplateVar{
			{
				"type": "text",
				"text": name,
			},
			{
				"type": "text",
				"text": creationDate,
			},
			{
				"type": "text",
				"text": phone,
			},
		},
	}
}

func BuildPropertyInfoRequest(name, phone, property, creationDate string) TemplateData {
	return TemplateData{
		TemplateName: "sbr_prop_info_req",
		BodyVars: []TemplateVar{
			{
				"type": "text",
				"text": name,
			},
			{
				"type": "text",
				"text": phone,
			},
			{
				"type": "text",
				"text": property,
			},
			{
				"type": "text",
				"text": creationDate,
			},
		},
	}
}

func BuildPropertyQuoteRequest(name, phone, property, quoteDate string) TemplateData {
	return TemplateData{
		TemplateName: "sibra_prop_request",
		BodyVars: []TemplateVar{
			{
				"type": "text",
				"text": name,
			},
			{
				"type": "text",
				"text": phone,
			},
			{
				"type": "text",
				"text": property,
			},
			{
				"type": "text",
				"text": quoteDate,
			},
		},
		Language: "es",
	}
}

func BuildProjectQuoteRequest(name, phone, project, quoteDate string) TemplateData {
	return TemplateData{
		TemplateName: "sibra_proj_request",
		BodyVars: []TemplateVar{
			{
				"type": "text",
				"text": name,
			},
			{
				"type": "text",
				"text": phone,
			},
			{
				"type": "text",
				"text": project,
			},
			{
				"type": "text",
				"text": quoteDate,
			},
		},
		Language: "es",
	}
}

func BuildPrequalifyRequest(name, phone, quoteDate string) TemplateData {
	return TemplateData{
		TemplateName: "sibra_preq_request",
		BodyVars: []TemplateVar{
			{
				"type": "text",
				"text": name,
			},
			{
				"type": "text",
				"text": phone,
			},
			{
				"type": "text",
				"text": quoteDate,
			},
		},
		Language: "es",
	}
}

func BuildSellPropRequest(name, phone, quoteDate string) TemplateData {
	return TemplateData{
		TemplateName: "sibra_sell_request",
		BodyVars: []TemplateVar{
			{
				"type": "text",
				"text": name,
			},
			{
				"type": "text",
				"text": phone,
			},
			{
				"type": "text",
				"text": quoteDate,
			},
		},
		Language: "es",
	}
}
