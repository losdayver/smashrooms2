![logo](https://raw.githubusercontent.com/losdayver/smashsrooms2/refs/heads/master/promo/goofylogo.png)

**smashrooms 2** is a fast acton-based multiplayer platformer inspired by the one and only **Duck game**.

🚧🏗️ **Under construction** 👷🚧

## Agenda

This is a passion project of mine that began as a straightforward university assignment for my networking class (you can check it out here: https://github.com/losdayver/Internet-Battle).

The first version was created using Python and the `Pygame` library, but for the second version, I wanted to shift to a web-based stack.

![screenshot](https://raw.githubusercontent.com/losdayver/smashsrooms2/refs/heads/master/promo/screenshot1.png)

## Deployment

### Docker

To deploy the application, simply run the `deploy.bash` script, which will automatically build a new Docker image and start the application within the `smashrooms2-container` Docker container:

```
./deploy.bash
```

By default, the application operates on two TCP ports: `5889` and `5890`. Port 5889 is utilized for WebSocket connections, while port 5890 is used for serving static content. You can access the application user interface at http://127.0.0.1:5890.

**Enjoy!**
