extends Node2D

const ENEMY = preload("res://scenes/enemy.tscn")
const TOWER = preload("res://scenes/tower.tscn")

@export var spawn_interval := 2.0
@export var wave_size := 10

var money := 200
var lives := 20
var wave := 1
var enemies_spawned := 0
var spawn_timer := 0.0
var wave_in_progress := false

@onready var spawn_point = $SpawnPoint
@onready var path = $Path2D
@onready var ui = $UI
@onready var tower_container = $Towers

var selected_tower_type = null
var placeable := false

func _ready():
	ui.update_money(money)
	ui.update_lives(lives)
	ui.update_wave(wave)
	start_wave()

func _process(delta):
	if wave_in_progress:
		spawn_timer += delta
		if spawn_timer >= spawn_interval and enemies_spawned < wave_size:
			spawn_enemy()
			spawn_timer = 0.0

func spawn_enemy():
	var enemy = ENEMY.instantiate()
	enemy.path_follow = path.get_node("PathFollow2D")
	enemy.position = spawn_point.position
	enemy.died.connect(_on_enemy_died)
	enemy.reached_end.connect(_on_enemy_reached_end)
	add_child(enemy)
	enemies_spawned += 1
	print("生成敌人 #", enemies_spawned, " 位置: ", enemy.position)

	if enemies_spawned >= wave_size:
		wave_in_progress = false

func _on_enemy_died(reward):
	money += reward
	ui.update_money(money)
	check_wave_complete()

func _on_enemy_reached_end():
	lives -= 1
	ui.update_lives(lives)
	if lives <= 0:
		game_over()
	check_wave_complete()

func check_wave_complete():
	if not wave_in_progress and get_tree().get_nodes_in_group("enemies").size() == 0:
		await get_tree().create_timer(2.0).timeout
		start_next_wave()

func start_wave():
	wave_in_progress = true
	enemies_spawned = 0
	spawn_timer = 0.0

func start_next_wave():
	wave += 1
	wave_size += 3
	ui.update_wave(wave)
	start_wave()

func game_over():
	get_tree().paused = true
	ui.show_game_over()

func _on_tower_button_pressed(tower_type):
	selected_tower_type = tower_type
	placeable = true

func place_tower(pos: Vector2):
	var tower_cost = 50
	var tower_stats = {
		"attack_range": 200.0,
		"attack_speed": 1.0,
		"damage": 25.0,
		"bullet_speed": 400.0
	}

	if selected_tower_type == "rapid":
		tower_cost = 100
		tower_stats = {
			"attack_range": 180.0,
			"attack_speed": 2.0,
			"damage": 15.0,
			"bullet_speed": 500.0
		}

	if money < tower_cost:
		print("金钱不足！")
		return

	var tower = TOWER.instantiate()
	tower.position = pos
	tower.attack_range = tower_stats.attack_range
	tower.attack_speed = tower_stats.attack_speed
	tower.damage = tower_stats.damage
	tower.bullet_speed = tower_stats.bullet_speed
	tower_container.add_child(tower)

	money -= tower_cost
	ui.update_money(money)

	placeable = false
	selected_tower_type = null

func _unhandled_input(event):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if placeable and selected_tower_type != null:
			place_tower(event.position)
