CREATE DATABASE TLP;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
FLUSH PRIVILEGES;
USE TLP;


CREATE TABLE studentInfo (
    rollNo VARCHAR(15), 
    token VARCHAR(9),
    PRIMARY KEY (rollNo)
);

CREATE TABLE subjects (
    subName VARCHAR(30),
    acsem VARCHAR(5)
);

CREATE TABLE users (
    userName VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),
    displayName VARCHAR(255)
);

INSERT INTO users VALUES ("admin", "2d207f75d95007876a8a2971928102c1","AD");

INSERT INTO studentinfo VALUES("21R11A05L0", "UNDONE");

Insert into subjects values("WT", "2-2"),
    -> ("DAA", "2-2"),
    -> ("WT-LAB", "2-2"),
    -> ("DAA-LAB", "2-2");