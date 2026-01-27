extends CanvasLayer

@onready var money_label = $Panel/VBoxContainer/MoneyLabel
@onready var lives_label = $Panel/VBoxContainer/LivesLabel
@onready var wave_label = $Panel/VBoxContainer/WaveLabel
@onready var game_over_panel = $GameOverPanel

func _ready():
	game_over_panel.visible = false

func update_money(amount: int):
	money_label.text = "金钱: " + str(amount)

func update_lives(amount: int):
	lives_label.text = "生命: " + str(amount)

func update_wave(wave: int):
	wave_label.text = "波次: " + str(wave)

func show_game_over():
	game_over_panel.visible = true

func _on_restart_button_pressed():
	get_tree().reload_current_scene()

func _on_tower1_button_pressed():
	get_parent()._on_tower_button_pressed("basic")

func _on_tower2_button_pressed():
	get_parent()._on_tower_button_pressed("rapid")
