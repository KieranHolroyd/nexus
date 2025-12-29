package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	_ "modernc.org/sqlite"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run scripts/migrate_db.go <sqlite_path> <mysql_dsn>")
		fmt.Println("Example: go run scripts/migrate_db.go data/nexus.db \"nexus_user:nexus_password@tcp(localhost:8767)/nexus?parseTime=true\"")
		os.Exit(1)
	}

	sqlitePath := os.Args[1]
	mysqlDSN := os.Args[2]

	sqliteDB, err := sql.Open("sqlite", sqlitePath)
	if err != nil {
		log.Fatalf("Failed to open SQLite: %v", err)
	}
	defer sqliteDB.Close()

	mysqlDB, err := sql.Open("mysql", mysqlDSN)
	if err != nil {
		log.Fatalf("Failed to open MySQL: %v", err)
	}
	defer mysqlDB.Close()

	fmt.Println("Migrating users...")
	migrateUsers(sqliteDB, mysqlDB)

	fmt.Println("Migrating credentials...")
	migrateCredentials(sqliteDB, mysqlDB)

	fmt.Println("Migrating services...")
	migrateServices(sqliteDB, mysqlDB)

	fmt.Println("Migration complete!")
}

func migrateUsers(src, dst *sql.DB) {
	rows, err := src.Query("SELECT id, username, display_name, approved, password_hash FROM users")
	if err != nil {
		log.Fatalf("Failed to query users: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, username, displayName, passwordHash string
		var approved bool
		rows.Scan(&id, &username, &displayName, &approved, &passwordHash)
		_, err := dst.Exec("INSERT INTO users (id, username, display_name, approved, password_hash) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username=VALUES(username)", id, username, displayName, approved, passwordHash)
		if err != nil {
			log.Printf("Failed to migrate user %s: %v", username, err)
		}
	}
}

func migrateCredentials(src, dst *sql.DB) {
	rows, err := src.Query("SELECT id, user_id, public_key, attestation_type, aaguid, sign_count, clone_warning, backup_eligible, backup_state FROM credentials")
	if err != nil {
		log.Fatalf("Failed to query credentials: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, userID []byte
		var publicKey, aaguid []byte
		var signCount int64
		var cloneWarning, backupEligible, backupState bool
		var attTypeStr string

		rows.Scan(&id, &userID, &publicKey, &attTypeStr, &aaguid, &signCount, &cloneWarning, &backupEligible, &backupState)

		_, err := dst.Exec("INSERT INTO credentials (id, user_id, public_key, attestation_type, aaguid, sign_count, clone_warning, backup_eligible, backup_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)",
			id, userID, publicKey, attTypeStr, aaguid, signCount, cloneWarning, backupEligible, backupState)
		if err != nil {
			log.Printf("Failed to migrate credential: %v", err)
		}
	}
}

func migrateServices(src, dst *sql.DB) {
	rows, err := src.Query("SELECT id, name, url, icon, `group`, `order`, public, auth_required, new_tab FROM services")
	if err != nil {
		// Try without backticks if it fails (SQLite might have used double quotes)
		rows, err = src.Query("SELECT id, name, url, icon, \"group\", \"order\", public, auth_required, new_tab FROM services")
		if err != nil {
			log.Fatalf("Failed to query services: %v", err)
		}
	}
	defer rows.Close()

	for rows.Next() {
		var id, name, url, icon, group string
		var order int
		var public, authRequired, newTab bool
		rows.Scan(&id, &name, &url, &icon, &group, &order, &public, &authRequired, &newTab)
		_, err := dst.Exec("INSERT INTO services (id, name, url, icon, `group`, `order`, public, auth_required, new_tab) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
			id, name, url, icon, group, order, public, authRequired, newTab)
		if err != nil {
			log.Printf("Failed to migrate service %s: %v", name, err)
		}
	}
}
