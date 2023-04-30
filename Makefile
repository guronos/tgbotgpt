build:
	sudo docker build -t botchat .
run:
	docker run --name tgbot -p 3000:3000 -d botchat
exportfile:
	sudo docker save --output botchat_app.tar botchat
deploy: 
	sudo scp botchat_app.tar root@45.12.237.187:./