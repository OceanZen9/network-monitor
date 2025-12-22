import socketio
import sys
import time

# Create a Socket.IO client instance
sio = socketio.Client()

SERVER_URL = 'http://127.0.0.1:5001'

@sio.event
def connect():
    print(f"✅ Connected to server at {SERVER_URL}")

@sio.event
def disconnect():
    print("❌ Disconnected from server")

def main():
    print("Distributed Host Monitoring - Client Agent")
    print("------------------------------------------")
    
    # Get client info
    client_id = input("Enter Client ID (match with XML): ")
    client_name = input("Enter Client Name: ")
    
    try:
        sio.connect(SERVER_URL)
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    while True:
        print("\nSelect Event to Simulate:")
        print("1. System Start")
        print("2. System Shut Down")
        print("3. IE Start")
        print("4. IE Close")
        print("q. Quit")
        
        choice = input("Choice: ")
        
        if choice == 'q':
            break
        
        event_type = ""
        msg = ""
        
        if choice == '1':
            event_type = "System Start"
            msg = f"Host {client_name} ({client_id}) System Started"
        elif choice == '2':
            event_type = "System Shut Down"
            msg = f"Host {client_name} ({client_id}) System Shut Down"
        elif choice == '3':
            event_type = "IE Start"
            msg = f"Host {client_name} ({client_id}) IE Browser Started"
        elif choice == '4':
            event_type = "IE Close"
            msg = f"Host {client_name} ({client_id}) IE Browser Closed"
        else:
            print("Invalid choice")
            continue
            
        payload = {
            'client_id': client_id,
            'client_name': client_name,
            'type': event_type,
            'msg': msg,
            'timestamp': time.time()
        }
        
        sio.emit('client_event', payload)
        print(f"Sent: {msg}")

    sio.disconnect()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)
