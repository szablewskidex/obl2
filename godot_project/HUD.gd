extends Control

onready var score_label = $ScoreLabel
onready var lives_label = $LivesLabel
onready var coins_label = $CoinsLabel

func _ready():
	if GameManager:
		GameManager.connect("score_changed", self, "_on_score_changed")
		GameManager.connect("lives_changed", self, "_on_lives_changed")
	update_ui()

func _on_score_changed(new_score):
	score_label.text = "Score: " + str(new_score)

func _on_lives_changed(new_lives):
	lives_label.text = "Lives: " + str(new_lives)

func update_ui():
	if GameManager:
		_on_score_changed(GameManager.score)
		_on_lives_changed(GameManager.lives)
		coins_label.text = "Coins: " + str(GameManager.coins_collected) + "/" + str(GameManager.total_coins)