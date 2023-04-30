build:
	sudo docker build -t botchat .
run:
	docker run --name tgbot -p 3000:3000 -d botchat