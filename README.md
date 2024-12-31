![logo](https://raw.githubusercontent.com/losdayver/smashsrooms2/refs/heads/master/promo/goofylogo.png)

**smashrooms 2** is a fast action-based multiplayer platformer inspired by the one and only **Duck game**.

🚧🏗️ **Under construction** 👷🚧

## Overview

This is a passion project of mine that began as a straightforward university assignment for my networking class (you can check it out here: https://github.com/losdayver/Internet-Battle).

The first version was created using Python and the `Pygame` library, but for the second version, I wanted to shift to a web-based stack.

![screenshot](https://raw.githubusercontent.com/losdayver/smashsrooms2/refs/heads/master/promo/screenshot1.png)

## I wanna try it now!

The testing stand is already deployed here http://olegzhmelev.ru:5890. Note that this is the TEST version. The stand can be redepolyed at any point.

## Deployment

### Docker

To deploy the application, simply run the `deploy.bash` script, which will automatically build a new Docker image and start the application within the `smashrooms2-container` Docker container:

```
./deploy.bash
```

By default, the application operates on two TCP ports: `5889` and `5890`. Port 5889 is utilized for WebSocket connections, while port 5890 is used for serving static content. You can access the application user interface at http://127.0.0.1:5890.

## License

This project is licensed under the terms of the GNU General Public License (GPL) v3.0. 
You can freely redistribute and modify this software under the terms of the GPL. 
For more details, please see the LICENSE.txt file included in this repository.

## Copyright

Copyright © 2024 Oleg Zhmelev
