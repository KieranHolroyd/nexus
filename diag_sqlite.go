package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

func main() {
	dbPath := "test_write.db"
	defer os.Remove(dbPath)

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("open error: %v", err)
	}
	defer db.Close()

	_, err = db.Exec("CREATE TABLE test (id INTEGER PRIMARY KEY, val TEXT)")
	if err != nil {
		log.Fatalf("create table error: %v", err)
	}

	_, err = db.Exec("INSERT INTO test (val) VALUES (?)", "hello")
	if err != nil {
		log.Fatalf("insert error: %v", err)
	}

	var val string
	err = db.QueryRow("SELECT val FROM test").Scan(&val)
	if err != nil {
		log.Fatalf("query error: %v", err)
	}

	fmt.Printf("Success! Read value: %s\n", val)
}
