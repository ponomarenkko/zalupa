function logout (req, res) {

    res.cookie("token", "", { maxAge: -1 });
    res.redirect("/login");

}

export default logout;