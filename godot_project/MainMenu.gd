extends Control

onready var start_button = $VBoxContainer/StartButton
onready var quit_button = $VBoxContainer/QuitButton
onready var high_score_label = $HighScoreLabel

func _ready():
	start_button.connect("pressed", self, "_on_start_pressed")
	quit_button.connect("pressed", self, "_on_quit_pressed")
	
	if GameManager:
		high_score_label.text = "High Score: " + str(GameManager.high_score)

func _on_start_pressed():
	get_tree().change_scene("res://World.tscn")

func _on_quit_pressed():
	get_tree().quit()