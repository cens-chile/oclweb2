# oclweb2
Overhauled OCL Web Authoring Interface v2

### Run Dev
```bash
docker-compose up -d
```
* Visit http://localhost:4000

### Run Production (do check CORS origin policy with API_URL)
```bash
docker-compose -f docker-compose.yml up -d
```
* Visit http://localhost:4000


### Eslint
```bash
docker exec -it <container_name> bash -c "eslint src/ --ext=.js*"
```

### Create .env file

```conf
TAG=latest
NODE_ENV=development
API_URL=http://ip-url:8000
```
