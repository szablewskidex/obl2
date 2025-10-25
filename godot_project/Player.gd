extends KinematicBody2D

# Ulepszone mechaniki gracza dla gry "bungvo"
# Kompatybilne z Godot 3.x

# Stałe fizyki
const SPEED = 200.0
const JUMP_VELOCITY = -400.0
const WALL_JUMP_VELOCITY = -350.0
const DASH_SPEED = 300.0
const COYOTE_TIME = 0.1
const JUMP_BUFFER_TIME = 0.1
const WALL_SLIDE_SPEED = 50.0

# Zmienne fizyki
var velocity = Vector2.ZERO
var gravity = 980.0  # Standardowa grawitacja Godot 3.x
var is_wall_sliding = false
var can_dash = true
var dash_cooldown_timer = 0.0
var dash_cooldown_duration = 1.0
var coyote_timer = 0.0
var jump_buffer_timer = 0.0
var wall_jump_timer = 0.0
var facing_direction = 1

# Referencje do węzłów
onready var animation_player = $Torso/AnimationPlayer
onready var sprite = $Torso
onready var collision_shape = $CollisionShape2D
onready var area_detector = $Area2D  # Do detekcji przedmiotów

# Sygnały
signal player_died
signal coin_collected(value)
signal power_up_collected(type)

func _ready():
	# Dodaj gracza do grupy
	add_to_group("player")
	
	# Połącz sygnały jeśli parent ma odpowiednie metody
	var parent = get_parent()
	if parent.has_method("_on_player_died"):
		connect("player_died", parent, "_on_player_died")
	
	# Połącz detektor obszaru
	if area_detector:
		area_detector.connect("area_entered", self, "_on_area_entered")

func _physics_process(delta):
	handle_input(delta)
	apply_gravity(delta)
	handle_movement(delta)
	handle_wall_mechanics(delta)
	update_timers(delta)
	update_animations()
	
	# Zastosuj ruch z właściwymi parametrami dla Godot 3.x
	velocity = move_and_slide(velocity, Vector2.UP, false, 4, 0.785398, false)
	
	# Sprawdź czy gracz spadł poza mapę
	if global_position.y > 1000:
		die()

func handle_input(delta):
	# Skok z buforem
	if Input.is_action_just_pressed("ui_accept") or Input.is_action_just_pressed("jump"):
		jump_buffer_timer = JUMP_BUFFER_TIME
	
	# Dash
	if Input.is_action_just_pressed("dash") and can_dash:
		perform_dash()

func apply_gravity(delta):
	if not is_on_floor():
		velocity.y += gravity * delta
		# Szybsze spadanie dla lepszego feel'u
		if velocity.y > 0:
			velocity.y += gravity * delta * 0.5

func handle_movement(delta):
	# Godot 3.x nie ma Input.get_axis(), używamy tradycyjnego podejścia
	var direction = 0
	if Input.is_action_pressed("ui_left"):
		direction -= 1
	if Input.is_action_pressed("ui_right"):
		direction += 1
	
	if direction != 0 and wall_jump_timer <= 0:
		velocity.x = direction * SPEED
		facing_direction = direction
		# Obróć sprite w kierunku ruchu
		sprite.scale.x = abs(sprite.scale.x) * facing_direction
	elif wall_jump_timer <= 0:
		# Płynne zatrzymywanie - używamy lerp dla Godot 3.x
		velocity.x = lerp(velocity.x, 0, 10 * delta)

func handle_wall_mechanics(delta):
	# Sprawdź czy dotyka ściany
	var is_touching_wall = is_on_wall()
	
	if is_touching_wall and not is_on_floor() and velocity.y > 0:
		# Wall sliding
		is_wall_sliding = true
		velocity.y = min(velocity.y, WALL_SLIDE_SPEED)  # Ogranicz prędkość spadania
		can_dash = true  # Odnów dash przy ścianie
	else:
		is_wall_sliding = false
	
	# Wall jump
	if is_wall_sliding and jump_buffer_timer > 0:
		perform_wall_jump()

func perform_jump():
	velocity.y = JUMP_VELOCITY
	jump_buffer_timer = 0
	coyote_timer = 0

func perform_wall_jump():
	var wall_normal = get_wall_normal()
	velocity.x = wall_normal.x * SPEED * 1.2
	velocity.y = WALL_JUMP_VELOCITY
	jump_buffer_timer = 0
	wall_jump_timer = 0.2  # Krótki czas bez kontroli kierunku

func perform_dash():
	var direction = Vector2.ZERO
	
	# Określ kierunek dash'a
	if Input.is_action_pressed("ui_left"):
		direction.x = -1
	elif Input.is_action_pressed("ui_right"):
		direction.x = 1
	elif Input.is_action_pressed("ui_up"):
		direction.y = -1
	elif Input.is_action_pressed("ui_down"):
		direction.y = 1
	else:
		# Domyślnie dash w kierunku patrzenia
		direction.x = facing_direction
	
	if direction != Vector2.ZERO:
		velocity = direction.normalized() * DASH_SPEED
		can_dash = false
		dash_cooldown_timer = dash_cooldown_duration

func get_dash_cooldown_progress():
	if dash_cooldown_timer <= 0:
		return 1.0
	return 1.0 - (dash_cooldown_timer / dash_cooldown_duration)

func update_timers(delta):
	# Coyote time - krótki czas po opuszczeniu platformy
	if is_on_floor():
		coyote_timer = COYOTE_TIME
		can_dash = true  # Odnów dash na ziemi
	else:
		coyote_timer -= delta
	
	# Jump buffer
	if jump_buffer_timer > 0:
		jump_buffer_timer -= delta
		
		# Wykonaj skok jeśli możliwe
		if (is_on_floor() or coyote_timer > 0) and wall_jump_timer <= 0:
			perform_jump()
	
	# Wall jump timer
	if wall_jump_timer > 0:
		wall_jump_timer -= delta
	
	# Dash cooldown timer
	if dash_cooldown_timer > 0:
		dash_cooldown_timer -= delta
		if dash_cooldown_timer <= 0:
			can_dash = true

func update_animations():
	if animation_player:
		if is_on_floor():
			if abs(velocity.x) > 10:
				if animation_player.has_animation("Run"):
					animation_player.play("Run")
			else:
				if animation_player.has_animation("Idle"):
					animation_player.play("Idle")
		else:
			if is_wall_sliding:
				if animation_player.has_animation("WallSlide"):
					animation_player.play("WallSlide")
				elif animation_player.has_animation("Idle"):
					animation_player.play("Idle")
			else:
				if animation_player.has_animation("Jumper"):
					animation_player.play("Jumper")
				elif animation_player.has_animation("Idle"):
					animation_player.play("Idle")

func collect_coin(value = 10):
	emit_signal("coin_collected", value)

func collect_power_up(type):
	emit_signal("power_up_collected", type)

func die():
	emit_signal("player_died")
	set_physics_process(false)

func respawn(spawn_position):
	global_position = spawn_position
	velocity = Vector2.ZERO
	set_physics_process(true)

# Funkcje pomocnicze dla kolizji z przedmiotami
func _on_area_entered(area):
	if area.is_in_group("coins"):
		var coin_value = 10
		if area.has_method("get_value"):
			coin_value = area.get_value()
		collect_coin(coin_value)
		area.get_parent().queue_free()
	elif area.is_in_group("power_ups"):
		var power_type = "speed"
		if area.has_method("get_power_type"):
			power_type = area.get_power_type()
		collect_power_up(power_type)
		area.get_parent().queue_free()
	elif area.is_in_group("enemies"):
		die()
	elif area.is_in_group("hazards"):
		die()