import xml.etree.ElementTree as ET
import os

XML_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'clients.xml')

class XMLManager:
    @staticmethod
    def _get_root():
        if not os.path.exists(XML_FILE):
             root = ET.Element("clients")
             tree = ET.ElementTree(root)
             tree.write(XML_FILE)
        tree = ET.parse(XML_FILE)
        return tree, tree.getroot()

    @staticmethod
    def get_clients():
        _, root = XMLManager._get_root()
        clients = []
        for client in root.findall('client'):
            clients.append({
                'id': client.find('id').text,
                'name': client.find('name').text,
                'ip': client.find('ip').text,
                'description': client.find('description').text
            })
        return clients

    @staticmethod
    def add_client(data):
        tree, root = XMLManager._get_root()
        
        # Simple ID generation (max id + 1)
        current_max_id = 0
        for client in root.findall('client'):
            try:
                cid = int(client.find('id').text)
                if cid > current_max_id:
                    current_max_id = cid
            except:
                pass
        
        new_id = str(current_max_id + 1)
        
        client_elem = ET.SubElement(root, 'client')
        ET.SubElement(client_elem, 'id').text = new_id
        ET.SubElement(client_elem, 'name').text = data.get('name', '')
        ET.SubElement(client_elem, 'ip').text = data.get('ip', '')
        ET.SubElement(client_elem, 'description').text = data.get('description', '')
        
        tree.write(XML_FILE)
        return new_id

    @staticmethod
    def update_client(client_id, data):
        tree, root = XMLManager._get_root()
        for client in root.findall('client'):
            if client.find('id').text == str(client_id):
                client.find('name').text = data.get('name', client.find('name').text)
                client.find('ip').text = data.get('ip', client.find('ip').text)
                client.find('description').text = data.get('description', client.find('description').text)
                tree.write(XML_FILE)
                return True
        return False

    @staticmethod
    def delete_client(client_id):
        tree, root = XMLManager._get_root()
        for client in root.findall('client'):
            if client.find('id').text == str(client_id):
                root.remove(client)
                tree.write(XML_FILE)
                return True
        return False
