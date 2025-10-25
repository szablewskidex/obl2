extends Node2D

onready var spawn_point = $SpawnPoint

func _ready():
	if GameManager:
		GameManager.initialize_level()
		GameManager.set_spawn_point(spawn_point.global_position)