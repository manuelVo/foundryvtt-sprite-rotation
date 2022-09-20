import { libWrapper } from "./libwrapper_shim.js";

Hooks.once("init", () => {
	libWrapper.register("sprite-rotation", "VisionSource.prototype.initialize", visionSourceInitialize, "OVERRIDE");
	libWrapper.register("sprite-rotation", "LightSource.prototype.initialize", lightSourceInitialize, "OVERRIDE");
	libWrapper.register("sprite-rotation", "TokenConfig.prototype._renderInner", renderInner, "WRAPPER");
});

async function renderInner(wrapped, data) {
	const html = await wrapped(data);
	const spriteRotation = data.object.flags.spriteRotation ?? 0;
	html.find(".tab[data-tab=appearance] > .form-group").first().after(`<div class="form-group slim"><label>${game.i18n.localize("sprite-rotation")} <span class="units">(${game.i18n.localize("Degrees")})</span></label><div class="form-fields"><input type="number" name="flags.spriteRotation" value="${spriteRotation}"/></div></div>`);
	return html;
}

function visionSourceInitialize(data = {}) {
	console.warn(this);
	// Initialize new input data
	const changes = this._initializeData(data);

	// Compute derived data attributes
	this.radius = Math.max(Math.abs(this.data.dim), Math.abs(this.data.bright));
	this.ratio = Math.clamped(Math.abs(this.data.bright) / this.radius, 0, 1);
	this.limited = this.data.angle !== 360;

	// Compute the source polygon
	const origin = { x: this.data.x, y: this.data.y };
	this.los = CONFIG.Canvas.losBackend.create(origin, {
		type: "sight",
		angle: this.data.angle,
		rotation: this.data.rotation + (this.object.data.flags.spriteRotation ?? 0),
		source: this
	});

	// Store the FOV circle
	this.fov = new PIXI.Circle(origin.x, origin.y, this.radius);

	// Record status flags
	this._flags.useFov = canvas.performance.textures.enabled;
	this._flags.renderFOV = true;
	if (this.constructor._appearanceKeys.some(k => k in changes)) {
		for (let k of Object.keys(this._resetUniforms)) {
			this._resetUniforms[k] = true;
		}
	}

	// Set the correct blend mode
	this._initializeBlending();
	return this;
}

function lightSourceInitialize(data={}) {

    // Initialize new input data
    const changes = this._initializeData(data);

    // Record the requested animation configuration
    const seed = this.animation.seed ?? data.seed ?? Math.floor(Math.random() * 100000);
    this.animation = foundry.utils.deepClone(CONFIG.Canvas.lightAnimations[this.data.animation.type]) || {};
    this.animation.seed = seed;

    // Compute data attributes
    this.colorRGB = foundry.utils.hexToRGB(this.data.color);
    this.radius = Math.max(Math.abs(this.data.dim), Math.abs(this.data.bright));
    this.ratio = Math.clamped(Math.abs(this.data.bright) / this.radius, 0, 1);
    this.isDarkness = this.data.luminosity < 0;

	let rotation = this.data.rotation;
	if (this.object instanceof Token) {
		rotation += this.object.data.flags.spriteRotation ?? 0;
	}

    // Compute the source polygon
    const origin = {x: this.data.x, y: this.data.y};
    this.los = CONFIG.Canvas.losBackend.create(origin, {
      type: this.data.walls ? "light" : "universal",
      angle: this.data.angle,
      density: 60,
      radius: this.radius,
      rotation: rotation,
      source: this
    });

    // Update shaders if the animation type or the constrained wall option changed
    const updateShaders = ("animation.type" in changes || "walls" in changes);
    if ( updateShaders ) this._initializeShaders();

    // Record status flags
    this._flags.useFov = !this.preview && canvas.performance.textures.enabled;
    this._flags.hasColor = !!(this.data.color && this.data.alpha);
    this._flags.renderFOV = true;
    if ( updateShaders || this.constructor._appearanceKeys.some(k => k in changes) ) {
      for ( let k of Object.keys(this._resetUniforms) ) {
        this._resetUniforms[k] = true;
      }
    }

    // Initialize blend modes and sorting
    this._initializeBlending();
    return this;
  }
