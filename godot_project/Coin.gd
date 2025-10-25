extends Node2D

export var value = 10
export var spin_speed = 180.0

onready var sprite = $Sprite
onready var area = $Area2D

func _ready():
	area.add_to_group("coins")

func _process(delta):
	sprite.rotation_degrees += spin_speed * delta

func get_value():
	return value