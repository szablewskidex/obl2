extends Node

# Menedżer gry - zarządza punktami, życiami, poziomami
# Singleton - dodaj do AutoLoad w Project Settings

# Sygnały
signal score_changed(new_score)
signal lives_changed(new_lives)
signal game_over
signal level_completed

# Zmienne gry
var score = 0
var lives = 3
var level = 1
var high_score = 0
var coins_collected = 0
var total_coins = 0

# Referencje
var player
var hud
var spawn_point

func _ready():
	# Wczytaj najlepszy wynik
	load_high_score()
	
func initialize_level():
	# Wywołaj to na początku każdego poziomu
	yield(get_tree(), "idle_frame")  # Poczekaj na gotowość sceny
	
	# Znajdź referencje
	var players = get_tree().get_nodes_in_group("player")
	player = players[0] if players.size() > 0 else null
	
	hud = get_tree().current_scene.find_node("HUD", true, false)
	
	# Połącz sygnały
	if player:
		if not player.is_connected("coin_collected", self, "_on_coin_collected"):
			player.connect("coin_collected", self, "_on_coin_collected")
		if not player.is_connected("power_up_collected", self, "_on_power_up_collected"):
			player.connect("power_up_collected", self, "_on_power_up_collected")
		if not player.is_connected("player_died", self, "_on_player_died"):
			player.connect("player_died", self, "_on_player_died")
	
	# Policz monety w poziomie
	count_total_coins()
	coins_collected = 0
	
	# Aktualizuj HUD
	if hud and hud.has_method("update_ui"):
		hud.update_ui()

func _on_coin_collected(value):
	score += value
	coins_collected += 1
	emit_signal("score_changed", score)
	
	# Sprawdź czy zebrano wszystkie monety
	if coins_collected >= total_coins and total_coins > 0:
		complete_level()

func _on_power_up_collected(type):
	score += 50  # Bonus za power-up
	emit_signal("score_changed", score)

func _on_player_died():
	lives -= 1
	emit_signal("lives_changed", lives)
	
	if lives <= 0:
		game_over()
	else:
		respawn_player()

func respawn_player():
	if player and spawn_point:
		player.respawn(spawn_point)

func game_over():
	emit_signal("game_over")
	
	# Zapisz najlepszy wynik
	if score > high_score:
		high_score = score
		save_high_score()

func complete_level():
	emit_signal("level_completed")
	
	# Bonus za ukończenie poziomu
	var level_bonus = level * 100
	score += level_bonus
	emit_signal("score_changed", score)

func restart_game():
	score = 0
	lives = 3
	level = 1
	coins_collected = 0
	get_tree().paused = false
	get_tree().reload_current_scene()

func save_high_score():
	var file = File.new()
	var error = file.open("user://high_score.save", File.WRITE)
	if error == OK:
		file.store_32(high_score)
		file.close()

func load_high_score():
	var file = File.new()
	if file.file_exists("user://high_score.save"):
		var error = file.open("user://high_score.save", File.READ)
		if error == OK:
			high_score = file.get_32()
			file.close()
	else:
		high_score = 0

func set_spawn_point(position):
	spawn_point = position

func count_total_coins():
	total_coins = get_tree().get_nodes_in_group("coins").size()