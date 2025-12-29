package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const (
	baseURL   = "http://localhost:8080/api/v1"
	username  = "server1"
	password  = "admin123"
	tableID   = "4f550571-5024-4fcf-8a41-74a8f79b1f7e"
	productID = "98fe0eef-3ea1-4d37-b79c-61a6d105d066"
)

func main() {
	// 1. Login
	token, err := login()
	if err != nil {
		fmt.Printf("Login failed: %v\n", err)
		return
	}
	fmt.Printf("Login successful. Token: %s\n", token)

	// 2. Create Order
	if err := createOrder(token); err != nil {
		fmt.Printf("Create Order failed: %v\n", err)
	}
}

func login() (string, error) {
	data := map[string]string{
		"username": username,
		"password": password,
	}
	jsonData, _ := json.Marshal(data)

	resp, err := http.Post(baseURL+"/auth/login", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("status %d: %s", resp.StatusCode, string(body))
	}

	var res struct {
		Data struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}
	if res.Data.Token == "" {
		return "", fmt.Errorf("token not found in response")
	}
	return res.Data.Token, nil
}

func createOrder(token string) error {
	data := map[string]interface{}{
		"table_id": tableID,
		"items": []map[string]interface{}{
			{
				"product_id":           productID,
				"quantity":             1,
				"special_instructions": "Medium",
			},
		},
		"notes": "Test order from Go",
	}
	jsonData, _ := json.Marshal(data)

	req, err := http.NewRequest("POST", baseURL+"/server/orders", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Create Order Status: %d\n", resp.StatusCode)
	fmt.Printf("Response Body: %s\n", string(body))

	return nil
}
