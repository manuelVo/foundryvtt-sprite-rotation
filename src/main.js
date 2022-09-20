import { libWrapper } from "./libwrapper_shim.js";

Hooks.once("init", () => {
	libWrapper.register("sprite-rotation", "VisionSource.prototype._getPolygonConfiguration", getVisionSourcePolygonConfiguration, "WRAPPER");
	libWrapper.register("sprite-rotation", "LightSource.prototype._getPolygonConfiguration", getLightSourcePolygonConfiguration, "WRAPPER");
	libWrapper.register("sprite-rotation", "TokenConfig.prototype._renderInner", renderInner, "WRAPPER");
});

async function renderInner(wrapped, data) {
	const html = await wrapped(data);
	const spriteRotation = data.object.flags.spriteRotation ?? 0;
	html.find(".tab[data-tab=appearance] > .form-group").first().after(`<div class="form-group slim"><label>${game.i18n.localize("sprite-rotation")} <span class="units">(${game.i18n.localize("Degrees")})</span></label><div class="form-fields"><input type="number" name="flags.spriteRotation" value="${spriteRotation}"/></div></div>`);
	return html;
}

function getVisionSourcePolygonConfiguration(wrapped) {
	const config = wrapped();
	config.rotation += this.object.data.flags.spriteRotation ?? 0;
	return config;
}

function getLightSourcePolygonConfiguration(wrapped) {
	const config = wrapped();
	if (this.object instanceof Token) {
		config.rotation += this.object.data.flags.spriteRotation ?? 0;
	}
	return config;
}
